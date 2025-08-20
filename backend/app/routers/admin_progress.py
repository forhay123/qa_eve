from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional

from ..database import get_db
from ..dependencies import get_current_user, get_current_admin_user
from ..models import User, ProgressTracking, Topic
from ..schemas import ProgressOut, UserOut, ClassInfo  # ✅ Added ClassInfo

router = APIRouter(prefix="/admin/progress", tags=["Admin Progress"])


# ---------- Utility: Ensure Admin Access ----------
def admin_guard(current_user: User):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")


# ---------- Get All Student Progress (Full List) ----------
@router.get("/all", response_model=List[ProgressOut])
def get_all_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_guard(current_user)

    records = db.query(ProgressTracking).options(joinedload(ProgressTracking.topic)).all()

    return [
        ProgressOut(
            id=record.id,
            user_id=record.user_id,
            topic_id=record.topic_id,
            score=record.score,
            total_questions=record.total_questions,
            subject_name=record.topic.subject,
            topic_title=record.topic.title,
            completed_at=record.completed_at
        )
        for record in records
    ]


# ---------- Get Progress for a Specific Student ----------
@router.get("/student/{student_id}", response_model=List[ProgressOut])
def get_progress_by_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_guard(current_user)

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    records = db.query(ProgressTracking).filter(ProgressTracking.user_id == student_id)\
        .options(joinedload(ProgressTracking.topic)).all()

    return [
        ProgressOut(
            id=record.id,
            user_id=record.user_id,
            topic_id=record.topic_id,
            score=record.score,
            total_questions=record.total_questions,
            subject_name=record.topic.subject,
            topic_title=record.topic.title,
            completed_at=record.completed_at
        )
        for record in records
    ]


# ---------- Get Summary Over Time (Daily or Weekly) ----------
@router.get("/summary")
def get_summary(
    range: str = Query("weekly", enum=["daily", "weekly"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_guard(current_user)

    now = datetime.utcnow()
    start_time = now - timedelta(days=1) if range == "daily" else now - timedelta(weeks=1)

    summary = db.query(
        ProgressTracking.user_id,
        func.count(ProgressTracking.id).label("attempts"),
        func.avg(ProgressTracking.score).label("average_score")
    ).filter(ProgressTracking.completed_at >= start_time)\
     .group_by(ProgressTracking.user_id).all()

    return [
        {
            "student_id": item.user_id,
            "attempts": item.attempts,
            "average_score": round(item.average_score, 2) if item.average_score else 0
        }
        for item in summary
    ]


# ---------- ✅ Fix: Get Students by Class (Admin Dashboard Progress Page) ----------
@router.get("/get-students-by-class")
def get_students_by_class(
    level: str = Query(...),
    department: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    level = level.strip().lower()
    department = department.strip().lower()

    query = db.query(User).filter(
        func.lower(func.trim(User.role)) == "student",
        func.lower(func.trim(User.level)) == level
    )

    if level.startswith("ss") and department:
        query = query.filter(func.lower(func.trim(User.department)) == department)

    students = query.all()

    return [
        {"user_id": student.id, "full_name": student.full_name}
        for student in students
    ]


# ---------- ✅ Get All Unique Classes ----------
@router.get("/get-classes", response_model=List[ClassInfo])
def get_all_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    records = db.query(
        func.lower(func.trim(User.level)).label("level"),
        func.coalesce(func.lower(func.trim(User.department)), "").label("department")
    ).filter(
        func.lower(User.role) == "student"
    ).distinct().all()

    return [
        ClassInfo(level=r.level.strip(), department=r.department.strip() if r.department else "")
        for r in records
    ]


# ---------- ✅ New: Get User by ID (for /users/{id} route) ----------
@router.get("/user/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------- Get Current User's Own Progress ----------
@router.get("/my-progress", response_model=List[ProgressOut])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(ProgressTracking).filter(ProgressTracking.user_id == current_user.id)\
        .options(joinedload(ProgressTracking.topic)).all()

    return [
        ProgressOut(
            id=record.id,
            user_id=record.user_id,
            topic_id=record.topic_id,
            score=record.score,
            total_questions=record.total_questions,
            subject_name=record.topic.subject,
            topic_title=record.topic.title,
            completed_at=record.completed_at
        )
        for record in records
    ]
