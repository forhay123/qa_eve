from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import group_students, group_teachers, TeacherProfile, ChatGroup, ChatMessage, User, blocked_users
from ..schemas import ChatGroupCreate, ChatGroupOut, ChatMessageOut, BasicUserOut, GroupMemberOut
from ..dependencies import get_current_user, get_current_user_ws
import json
from datetime import datetime, timedelta
import uuid
import os
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
from sqlalchemy import or_, and_
import asyncio


router = APIRouter()



# -------------------- Connection Manager --------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, group_id: int, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, group_id: int, websocket: WebSocket):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast(self, group_id: int, message: dict):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"⚠️ Error broadcasting to group {group_id}: {e}")

manager = ConnectionManager()


# -------------------- Global Notification Manager --------------------

class GlobalNotificationManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        try:
            self.active_connections.append(websocket)
        except Exception as e:
            print(f"⚠️ Error appending websocket: {e}")

    def disconnect(self, websocket: WebSocket):
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        except Exception as e:
            print(f"⚠️ Error during disconnect cleanup: {e}")

    async def broadcast(self, message: dict):
        to_remove = []
        print(f"📣 Sending global notification: {message}")
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"⚠️ Failed to send notification: {e}")
                to_remove.append(connection)
        for conn in to_remove:
            self.disconnect(conn)

global_notifier = GlobalNotificationManager()




# -------------------- REST Endpoints --------------------

@router.post("/chat/groups", response_model=ChatGroupOut)
def create_group(group: ChatGroupCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_group = ChatGroup(
        name=group.name,
        level=group.level,
        department=group.department,
        is_class_group=group.is_class_group,
        is_custom_group=group.is_custom_group,
        created_by=user.id,
    )

    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # Associate students if custom group
    if group.student_ids:
        db.execute(
            group_students.insert(),
            [{"group_id": new_group.id, "student_id": sid} for sid in group.student_ids]
        )

    # Associate teachers if custom group
    if group.teacher_ids:
        db.execute(
            group_teachers.insert(),
            [{"group_id": new_group.id, "teacher_id": tid} for tid in group.teacher_ids]
        )

    db.commit()
    return new_group


@router.get("/chat/groups", response_model=list[ChatGroupOut])
def list_groups(db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = db.query(ChatGroup)

    if user.role == "admin":
        return query.all()

    if user.role == "student":
        return query.filter(
            or_(
                ChatGroup.id.in_(
                    db.query(group_students.c.group_id).filter(group_students.c.student_id == user.id)
                ),
                and_(
                    ChatGroup.is_class_group == True,
                    ChatGroup.level == user.level
                )
            )
        ).all()

    if user.role == "teacher":
        # Fetch teacher's level and department
        teacher_profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == user.id).first()
        if not teacher_profile:
            raise HTTPException(status_code=400, detail="Teacher profile not found.")

        return query.filter(
            or_(
                # Custom groups where teacher is manually added
                ChatGroup.id.in_(
                    db.query(group_teachers.c.group_id).filter(group_teachers.c.teacher_id == user.id)
                ),
                # Class groups where teacher's level matches
                and_(
                    ChatGroup.is_class_group == True,
                    ChatGroup.level == teacher_profile.level
                )
            )
        ).all()

    raise HTTPException(status_code=403, detail="Not authorized to access chat groups.")




# -------------------- File Upload Endpoint --------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # Adjust if needed
UPLOAD_DIR = BASE_DIR / "uploaded_files"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/files/upload")
async def upload_chat_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Determine file type properly
    content_type = file.content_type

    if content_type.startswith("image/"):
        file_type = "image"
    elif content_type.startswith("audio/"):
        file_type = "audio"
    elif content_type.startswith("video/"):
        file_type = "video"
    elif content_type in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        file_type = "document"
    else:
        file_type = "document"

    file_url = f"/static/{filename}"

    return {"file_url": file_url, "file_type": file_type}


# -------------------- WebSocket Chat --------------------


@router.websocket("/chat/ws/{group_id}")
async def websocket_chat(group_id: int, websocket: WebSocket, db: Session = Depends(get_db)):
    print(f"🔗 Incoming WebSocket connection: group_id={group_id}")
    
    try:
        user = await get_current_user_ws(websocket, db)
        print(f"✅ WebSocket user authenticated: id={user.id}, username={user.username}, role={user.role}")

        # ✅ Check if user is blocked
        is_blocked = db.execute(
            blocked_users.select().where(
                blocked_users.c.group_id == group_id,
                blocked_users.c.user_id == user.id
            )
        ).fetchone()

        if is_blocked:
            print(f"🚫 User {user.username} is blocked from group {group_id}")
            await websocket.send_json({
                "type": "error",
                "message": "You are blocked from this group chat."
            })
            await websocket.close(code=4003)
            return

        await manager.connect(group_id, websocket, user.id)
        print(f"📡 User {user.username} connected to group {group_id}")

        try:
            while True:
                data = await websocket.receive_json()
                print(f"📨 Received data from user {user.username}: {data}")

                event = data.get("type")
                if not event:
                    print("⚠️ Event type missing in message")
                    continue

                if event == "message":
                    print(f"💬 Handling message event from user {user.username}")
                    await handle_message(db, group_id, user, data)

                elif event == "file":
                    print(f"📂 Handling file event from user {user.username}")
                    await handle_file(db, group_id, user, data)

                elif event == "edit":
                    print(f"✏️ Handling edit event from user {user.username}")
                    await handle_edit(db, user, data)

                elif event == "delete":
                    print(f"🗑️ Handling delete event from user {user.username}")
                    await handle_delete(db, user, data)

                elif event == "typing":
                    print(f"⌨️ User {user.username} is typing...")
                    await manager.broadcast(group_id, {
                        "type": "typing",
                        "user_id": user.id,
                        "full_name": user.full_name
                    })

                elif event == "presence":
                    print(f"👥 Presence ping from {user.username}")
                    await manager.broadcast(group_id, {
                        "type": "presence",
                        "user_id": user.id,
                        "full_name": user.full_name,
                        "online": True
                    })

                else:
                    print(f"❓ Unknown event type: {event}")

        except WebSocketDisconnect:
            print(f"🔌 WebSocket disconnected: user={user.username}, group_id={group_id}")
            manager.disconnect(group_id, websocket)

            await manager.broadcast(group_id, {
                "type": "presence",
                "user_id": user.id,
                "full_name": user.full_name,
                "online": False
            })

        except Exception as e:
            print(f"🔥 Unexpected WebSocket error: {e}")
            await websocket.close(code=1011)  # Internal error

    except Exception as e:
        print(f"🚫 Failed to authenticate or connect user: {e}")
        await websocket.close(code=1008)  # Policy violation

# -------------------- Handlers --------------------

async def handle_message(db, group_id, user, data):
    msg = ChatMessage(
        group_id=group_id,
        sender_id=user.id,
        content=data["content"],
        timestamp=datetime.utcnow()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Send to group members
    await manager.broadcast(group_id, {
        "type": "message",
        "message_id": msg.id,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat(),
        "sender": {
            "id": user.id,
            "full_name": user.full_name
        }
    })

    # Send global notification
    await global_notifier.broadcast({
        "type": "notification",
        "event": "new_message",
        "group_id": group_id,
        "sender": user.full_name,
        "message_preview": data["content"][:50],
        "timestamp": datetime.utcnow().isoformat()
    })




async def handle_file(db, group_id, user, data):
    msg = ChatMessage(
        group_id=group_id,
        sender_id=user.id,
        file_url=data["file_url"],
        file_type=data["file_type"],
        timestamp=datetime.utcnow()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    await manager.broadcast(group_id, {
        "type": "file",
        "message_id": msg.id,
        "file_url": msg.file_url,
        "file_type": msg.file_type,
        "timestamp": msg.timestamp.isoformat(),
        "sender": {
            "id": user.id,
            "full_name": user.full_name
        }
    })

    # Send global notification
    await global_notifier.broadcast({
        "type": "notification",
        "event": "new_file",
        "group_id": group_id,
        "sender": user.full_name,
        "file_type": msg.file_type,
        "file_url": msg.file_url,
        "timestamp": datetime.utcnow().isoformat()
    })



async def handle_edit(db, user, data):
    msg = db.query(ChatMessage).filter(ChatMessage.id == data["message_id"]).first()
    if not msg:
        return

    history = json.loads(msg.edit_history) if msg.edit_history else []
    history.append(msg.content)
    msg.content = data["new_content"]
    msg.edit_history = json.dumps(history)
    db.commit()

    await manager.broadcast(msg.group_id, {
        "type": "edit",
        "message_id": msg.id,
        "new_content": msg.content,
        "editor": {
            "id": user.id,
            "full_name": user.full_name
        }
    })

async def handle_delete(db, user, data):
    msg = db.query(ChatMessage).filter(ChatMessage.id == data["message_id"]).first()
    if not msg:
        return

    msg.is_deleted = True
    history = json.loads(msg.edit_history) if msg.edit_history else []
    history.append(msg.content)
    msg.edit_history = json.dumps(history)
    msg.content = "[Deleted]"
    db.commit()

    await manager.broadcast(msg.group_id, {
        "type": "delete",
        "message_id": msg.id,
        "deleter": {
            "id": user.id,
            "full_name": user.full_name
        }
    })

# -------------------- Persistent Message API --------------------

class ChatMessageCreate(BaseModel):
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None

@router.get("/chat/groups/{group_id}/messages", response_model=list[ChatMessageOut])
def get_group_messages(group_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # ---------------- PERMISSION CHECK ----------------
    if user.role != "admin":
        from ..models import group_students, group_teachers, TeacherProfile

        is_member_student = db.query(group_students).filter(
            group_students.c.group_id == group_id,
            group_students.c.student_id == user.id
        ).first()

        is_member_teacher = db.query(group_teachers).filter(
            group_teachers.c.group_id == group_id,
            group_teachers.c.teacher_id == user.id
        ).first()

        if user.role == "student":
            if group.is_class_group and group.level != user.level and not is_member_student:
                raise HTTPException(status_code=403, detail="Not allowed to view this chat")
            if group.is_custom_group and not is_member_student:
                raise HTTPException(status_code=403, detail="Not allowed to view this chat")

        if user.role == "teacher":
            profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == user.id).first()
            if not profile:
                raise HTTPException(status_code=403, detail="Teacher profile not found")
            if group.is_class_group and group.level != profile.level and not is_member_teacher:
                raise HTTPException(status_code=403, detail="Not allowed to view this chat")
            if group.is_custom_group and not is_member_teacher:
                raise HTTPException(status_code=403, detail="Not allowed to view this chat")

    # ---------------- FETCH & FORMAT MESSAGES ----------------
    messages = db.query(ChatMessage).filter(
        ChatMessage.group_id == group_id
    ).order_by(ChatMessage.timestamp.asc()).all()

    response = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        if sender:
            response.append(ChatMessageOut(
                id=msg.id,
                sender_id=msg.sender_id,
                sender=BasicUserOut.from_orm(sender),
                content=msg.content,
                file_url=msg.file_url,
                file_type=msg.file_type,
                is_deleted=msg.is_deleted,
                edit_history=json.loads(msg.edit_history) if msg.edit_history else [],
                timestamp=msg.timestamp
            ))

    return response



@router.websocket("/chat/ws/notifications")
async def notifications_ws(websocket: WebSocket, db: Session = Depends(get_db)):
    print("📡 WS connection attempt")

    try:
        user = await get_current_user_ws(websocket, db)
        await websocket.accept()

    except WebSocketException as e:
        print(f"❌ WebSocket auth failed: {e.reason}")
        await websocket.close(code=e.code)
        return

    except Exception as e:
        print("❌ Unexpected WebSocket auth error:", e)
        await websocket.close(code=4400)  # Bad Request
        return

    print(f"✅ WS connected: {user.full_name}")
    global_notifier.active_connections.append(websocket)

    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        print(f"❌ WS disconnected: {user.full_name}")
    finally:
        global_notifier.disconnect(websocket)







@router.get("/chat/groups/{group_id}/members", response_model=list[GroupMemberOut])
def get_group_members(group_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    blocked = db.execute(
        blocked_users.select().where(blocked_users.c.group_id == group_id)
    ).fetchall()
    blocked_ids = {row.user_id for row in blocked}

    members = []

    if group.is_class_group:
        query = db.query(User).filter(User.role == "student", User.level == group.level)
        if group.department and group.department.lower() != "general":
            query = query.filter(User.department == group.department)

        for u in query.all():
            members.append(GroupMemberOut(
                id=u.id,
                username=u.username,
                email=u.email,                   # ✅ Required by BasicUserOut
                full_name=u.full_name,
                student_class=u.student_class,   # ✅ Required by BasicUserOut
                level=u.level,                   # ✅ Required by BasicUserOut
                is_blocked=u.id in blocked_ids   # ✅ From GroupMemberOut
            ))

    else:
        student_ids = db.query(group_students.c.student_id).filter(group_students.c.group_id == group_id).all()
        teacher_ids = db.query(group_teachers.c.teacher_id).filter(group_teachers.c.group_id == group_id).all()

        all_ids = [sid[0] for sid in student_ids] + [tid[0] for tid in teacher_ids]
        users = db.query(User).filter(User.id.in_(all_ids)).all()

        for u in users:
            members.append(GroupMemberOut(
                id=u.id,
                username=u.username,
                email=u.email,                   # ✅ Required
                full_name=u.full_name,
                student_class=u.student_class,   # ✅ Required
                level=u.level,                   # ✅ Required
                is_blocked=u.id in blocked_ids   # ✅ Optional, default False
            ))

    return members



class AddGroupMembersPayload(BaseModel):
    student_ids: Optional[list[int]] = []
    teacher_ids: Optional[list[int]] = []

@router.post("/chat/groups/{group_id}/add-members")
def add_group_members(
    group_id: int,
    payload: AddGroupMembersPayload,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if payload.student_ids:
        db.execute(
            group_students.insert(),
            [{"group_id": group_id, "student_id": sid} for sid in payload.student_ids]
        )

    if payload.teacher_ids:
        db.execute(
            group_teachers.insert(),
            [{"group_id": group_id, "teacher_id": tid} for tid in payload.teacher_ids]
        )

    db.commit()
    return {"message": "Members added"}



@router.delete("/chat/groups/{group_id}/remove-member/{user_id}")
def remove_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.execute(group_students.delete().where(
        group_students.c.group_id == group_id,
        group_students.c.student_id == user_id
    ))
    db.execute(group_teachers.delete().where(
        group_teachers.c.group_id == group_id,
        group_teachers.c.teacher_id == user_id
    ))

    db.commit()
    return {"message": "Member removed"}




@router.post("/chat/groups/{group_id}/block/{user_id}")
def block_group_member(group_id: int, user_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Prevent duplicate blocks
    existing = db.execute(
        blocked_users.select().where(
            blocked_users.c.group_id == group_id,
            blocked_users.c.user_id == user_id
        )
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="User is already blocked in this group")

    db.execute(blocked_users.insert().values(group_id=group_id, user_id=user_id))
    db.commit()
    return {"message": f"User {user_id} has been blocked from group {group_id}"}



class RestrictGroupPayload(BaseModel):
    duration_minutes: Optional[int] = None


@router.post("/chat/groups/{group_id}/restrict")
def restrict_group_chat(group_id: int, payload: RestrictGroupPayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if payload.duration_minutes:
        group.restricted_until = datetime.utcnow() + timedelta(minutes=payload.duration_minutes)
    else:
        raise HTTPException(status_code=400, detail="duration_minutes is required")

    db.commit()
    return {"message": f"Group muted for {payload.duration_minutes} minutes"}



@router.post("/chat/groups/{group_id}/unrestrict")
def unrestrict_group_chat(
    group_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    group.restricted_until = None
    db.commit()

    return {
        "message": "Group chat has been unmuted"
    }




@router.delete("/chat/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if user.id != msg.sender_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="You cannot delete this message")

    msg.is_deleted = True
    msg.content = "[Deleted]"
    msg.timestamp = datetime.utcnow()
    db.commit()

    return {"message": "Message deleted"}



@router.delete("/chat/groups/{group_id}/unblock/{user_id}")
def unblock_group_member(group_id: int, user_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.execute(blocked_users.delete().where(
        blocked_users.c.group_id == group_id,
        blocked_users.c.user_id == user_id
    ))
    db.commit()
    return {"message": f"User {user_id} unblocked from group {group_id}"}