from typing import List, Optional
from fastapi import Depends, HTTPException, status, WebSocket, WebSocketException
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from jose import JWTError
from .config import SECRET_KEY, ALGORITHM
from .database import get_db
from .models import User, TeacherProfile
from .security import oauth2_scheme
import os



ENV = os.getenv("ENV", "development")


# 🔐 Shared function to decode JWT tokens
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"❌ JWT decoding error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


# 🔐 HTTP: Decode JWT from Authorization header
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    user_id: int = payload.get("user_id")
    print(f"🪪 JWT payload → {payload}")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user_id missing"
        )

    user = (
        db.query(User)
        .options(joinedload(User.teacher_profile))
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # ✅ Mark user as recently active
    now = datetime.utcnow()
    user.last_login = now
    user.last_active = now  
    db.commit()

    return user


class WebSocketAuthenticationError(Exception):
    pass

async def get_current_user_ws(websocket: WebSocket, db: Session) -> User:
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketAuthenticationError("❌ Missing token in WebSocket connection")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise WebSocketAuthenticationError("❌ Token payload missing user_id")

    except JWTError as e:
        raise WebSocketAuthenticationError(f"❌ JWT decoding error: {e}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise WebSocketAuthenticationError(f"❌ No user found with id: {user_id}")

    print(f"✅ WebSocket authenticated user: {user.username} (id={user.id}, role={user.role})")
    return user


# ✅ Admin or Teacher Access
def get_current_admin_or_teacher_user(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> User:
    if user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or teacher can access this route"
        )
    return user


# 🛡️ Admin Only
def get_current_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


# 🎓 Student Only
def get_current_student_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this route"
        )
    return user


# 🧑‍🏫 Teacher with Profile
def get_current_teacher_user(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TeacherProfile:
    print(f"🧑‍🏫 Checking teacher → ID: {user.id}, Role: {user.role}")

    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this route"
        )

    profile = db.query(TeacherProfile).filter_by(user_id=user.id).first()

    if not profile:
        print(f"⚠️ No teacher profile found for user ID: {user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found"
        )

    return profile


# 🎯 Role Checker (Generic)
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to roles: {', '.join(self.allowed_roles)}"
            )
        return user


# 🧑‍🏫 Teacher Profile with Class Validation
def validate_teacher_with_class(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> TeacherProfile:
    profile = db.query(TeacherProfile).filter_by(user_id=user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found"
        )

    if not profile.level:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher profile missing assigned class level"
        )

    return profile


# 🔒 Require Teacher Role (Quick Check)
def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    print(f"🔐 User → ID: {current_user.id} | Username: {current_user.username} | Role: {current_user.role}")

    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers allowed")

    return current_user
