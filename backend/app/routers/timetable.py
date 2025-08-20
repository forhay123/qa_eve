from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user, get_current_admin_user, get_db

router = APIRouter(
    prefix="/timetable",
    tags=["Timetable"]
)


@router.get("/today", response_model=List[schemas.TimetableOut])
def get_today_timetable(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    today_day = datetime.today().strftime('%A').strip().lower()
    user_level = (user.level or "").strip().lower()
    user_department = (user.department or "").strip().lower()

    if not user_level:
        raise HTTPException(status_code=400, detail="User level not found")

    filters = [
        func.lower(func.trim(models.Timetable.day)) == today_day,
        func.lower(func.trim(models.Timetable.level)) == user_level,
    ]

    # Only filter by department if senior and department is set
    if user_level.startswith("ss") and user_department:
        filters.append(
            or_(
                func.lower(func.trim(models.Timetable.department)) == user_department,
                func.length(func.trim(models.Timetable.department)) == 0,
                models.Timetable.department == None
            )
        )
    # ✅ JSS will not be filtered by department at all

    timetables = (
        db.query(models.Timetable)
        .options(joinedload(models.Timetable.subject_rel))
        .filter(*filters)
        .order_by(models.Timetable.period)
        .all()
    )

    return [
        schemas.TimetableOut(
            id=t.id,
            day=t.day,
            subject=t.subject_rel.name if t.subject_rel else None,
            start_time=t.start_time,
            end_time=t.end_time,
            level=t.level,
            department=t.department,
            period=t.period
        )
        for t in timetables
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Admin: Get all or filtered timetable
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.TimetableOut])
def get_all_timetables(
    level: Optional[str] = Query(None, description="Filter by level (e.g., ss1, jss2)"),
    department: Optional[str] = Query(None, description="Filter by department (e.g., Science)"),
    db: Session = Depends(get_db),
    user=Depends(get_current_admin_user)
):
    query = db.query(models.Timetable).options(joinedload(models.Timetable.subject_rel))
    if level:
        query = query.filter(models.Timetable.level == level)
    if department:
        query = query.filter(models.Timetable.department == department)

    timetables = query.order_by(models.Timetable.day, models.Timetable.period).all()

    return [
        schemas.TimetableOut(
            id=t.id,
            day=t.day,
            subject=t.subject_rel.name if t.subject_rel else None,
            start_time=t.start_time,
            end_time=t.end_time,
            level=t.level,
            department=t.department,
            period=t.period
        ) for t in timetables
    ]

# ─────────────────────────────────────────────────────────────────────────────
# Teacher: Full timetable view (for debugging/complete view)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/all", response_model=List[schemas.TimetableOut])
def get_full_timetable_for_teacher(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    timetables = db.query(models.Timetable).options(joinedload(models.Timetable.subject_rel)).order_by(models.Timetable.day, models.Timetable.start_time).all()

    return [
        schemas.TimetableOut(
            id=t.id,
            day=t.day,
            subject=t.subject_rel.name if t.subject_rel else None,
            start_time=t.start_time,
            end_time=t.end_time,
            level=t.level,
            department=t.department,
            period=t.period
        ) for t in timetables
    ]

# ─────────────────────────────────────────────────────────────────────────────
# Teacher: Get timetable based on assigned subjects
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/teacher", response_model=List[schemas.TimetableOut])
def get_teacher_timetable(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this route.")

    teacher_subjects = (
        db.query(models.Subject.id, models.Subject.name)
        .join(models.TeacherSubject, models.TeacherSubject.subject_id == models.Subject.id)
        .filter(models.TeacherSubject.teacher_id == user.id)
        .all()
    )

    subject_ids = [s.id for s in teacher_subjects]

    if not subject_ids:
        return []

    timetables = (
        db.query(models.Timetable)
        .options(joinedload(models.Timetable.subject_rel))
        .filter(models.Timetable.subject_id.in_(subject_ids))
        .order_by(models.Timetable.day, models.Timetable.start_time)
        .all()
    )

    return [
        schemas.TimetableOut(
            id=t.id,
            day=t.day,
            subject=t.subject_rel.name if t.subject_rel else None,
            start_time=t.start_time,
            end_time=t.end_time,
            level=t.level,
            department=t.department,
            period=t.period
        ) for t in timetables
    ]

# ─────────────────────────────────────────────────────────────────────────────
# User: Get timetable by level (student or generic teacher view)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{level}", response_model=List[schemas.TimetableOut])
def get_timetable_for_user(
    level: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Normalize input
    user_level = level.strip().lower()
    user_dept = user.department.strip().lower() if user.department else None

    # Base query
    query = (
        db.query(models.Timetable)
        .options(joinedload(models.Timetable.subject_rel))
        .filter(
            func.lower(func.trim(models.Timetable.level)) == user_level
        )
    )

    # Add department logic for senior secondary (ss1, ss2, ss3)
    if user_level.startswith("ss") and user_dept:
        query = query.filter(
            or_(
                func.lower(func.trim(models.Timetable.department)) == user_dept,
                models.Timetable.department == None,
                func.length(func.trim(models.Timetable.department)) == 0,
            )
        )

    timetables = query.order_by(models.Timetable.day, models.Timetable.period).all()
    for t in timetables:
        subj = t.subject_rel.name if t.subject_rel else 'No subject'

    return [
        {
            "id": t.id,
            "day": t.day,
            "subject": t.subject_rel.name if t.subject_rel else None,
            "start_time": t.start_time.strftime("%H:%M") if hasattr(t.start_time, "strftime") else str(t.start_time),
            "end_time": t.end_time.strftime("%H:%M") if hasattr(t.end_time, "strftime") else str(t.end_time),
            "level": t.level,
            "department": t.department,
            "period": t.period
        }
        for t in timetables
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Admin: Create a new timetable entry
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/", response_model=schemas.TimetableOut, status_code=status.HTTP_201_CREATED)
def create_timetable(
    timetable: schemas.TimetableCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_admin_user)
):
    subject = db.query(models.Subject).filter(func.lower(models.Subject.name) == timetable.subject.lower()).first()
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject '{timetable.subject}' not found")

    new_entry = models.Timetable(
        day=timetable.day,
        level=timetable.level.lower(),
        department=timetable.department.lower() if timetable.department else None,
        start_time=timetable.start_time,
        end_time=timetable.end_time,
        period=timetable.period,
        subject_id=subject.id
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return schemas.TimetableOut(
        id=new_entry.id,
        day=new_entry.day,
        subject=subject.name,
        start_time=new_entry.start_time,
        end_time=new_entry.end_time,
        level=new_entry.level,
        department=new_entry.department,
        period=new_entry.period
    )

# ─────────────────────────────────────────────────────────────────────────────
# Admin: Update a timetable entry
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{timetable_id}", response_model=schemas.TimetableOut)
def update_timetable(
    timetable_id: int,
    updated: schemas.TimetableCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_admin_user)
):
    entry = db.get(models.Timetable, timetable_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable not found")

    subject = db.query(models.Subject).filter(func.lower(models.Subject.name) == updated.subject.lower()).first()
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject '{updated.subject}' not found")

    entry.day = updated.day
    entry.level = updated.level.lower()
    entry.department = updated.department.lower() if updated.department else None
    entry.start_time = updated.start_time
    entry.end_time = updated.end_time
    entry.period = updated.period
    entry.subject_id = subject.id

    db.commit()
    db.refresh(entry)

    return schemas.TimetableOut(
        id=entry.id,
        day=entry.day,
        subject=subject.name,
        start_time=entry.start_time,
        end_time=entry.end_time,
        level=entry.level,
        department=entry.department,
        period=entry.period
    )

# ─────────────────────────────────────────────────────────────────────────────
# Admin: Delete a timetable entry
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/{timetable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable(
    timetable_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_admin_user)
):
    entry = db.get(models.Timetable, timetable_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable not found")
    db.delete(entry)
    db.commit()


