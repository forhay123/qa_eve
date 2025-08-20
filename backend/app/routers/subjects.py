from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import List, Optional
import os
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models import Subject, Topic, User
from ..schemas import SubjectOut, SubjectUpdate, TopicOut
from ..auth import get_current_user
from ..services.llama_qa import generate_questions_from_pdf
from ..utils import safe_filename
from ..dependencies import get_current_teacher_user
from ..models import TeacherProfile



router = APIRouter(prefix="/subjects", tags=["Subjects"])

VALID_LEVELS = {"jss1", "jss2", "jss3", "ss1", "ss2", "ss3"}

LESSON_FOLDER = os.path.join("data", "lesson_pdfs")
PUBLIC_URL_PREFIX = "/lesson-pdfs"
os.makedirs(LESSON_FOLDER, exist_ok=True)


# ✅ Student: Get subjects by level and department
@router.get("/student-subjects")
def get_student_subjects(
    level: str = Query(...),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    level = level.strip().lower()
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid level.")

    department = department.strip().lower() if department else None

    subjects = db.query(Subject).filter(
        func.lower(Subject.level) == level,
        or_(
            Subject.department == None,
            func.length(func.trim(Subject.department)) == 0,
            func.lower(Subject.department) == department
        )
    ).order_by(Subject.name.asc()).all()

    return subjects


# ✅ Admin: Get all subjects (by level and department)
@router.get("/admin/subjects", response_model=List[SubjectOut])
def get_all_subjects_for_admin(
    level: str = Query(...),
    department: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    level = level.strip().lower()
    department = department.strip().lower()

    query = db.query(Subject).filter(func.lower(Subject.level) == level)
    if department:
        query = query.filter(func.lower(Subject.department) == department)

    subjects = query.order_by(Subject.name.asc()).all()
    return subjects


# ✅ Admin: Get total subject count
@router.get("/admin/subjects/count")
def get_total_subjects_count(
    level: str = Query(None),
    department: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(Subject)

    if level:
        query = query.filter(func.lower(Subject.level) == level.strip().lower())
    if department:
        query = query.filter(func.lower(Subject.department) == department.strip().lower())

    total = query.count()
    return {"total_subjects": total}


# ✅ Get a single subject by name and level (case-insensitive)
@router.get("/by-name/{level}/{subject_name}", response_model=SubjectOut)
def get_subject_by_name(level: str, subject_name: str, db: Session = Depends(get_db)):
    level = level.strip().lower()
    subject_name = subject_name.strip().lower()
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid level.")

    subject = db.query(Subject).filter(
        func.lower(Subject.level) == level,
        func.lower(Subject.name) == subject_name
    ).first()

    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


# ✅ Get all topics for a subject (case-insensitive match)
@router.get("/{level}/{subject_name}/topics", response_model=List[TopicOut])
def get_subject_topics(level: str, subject_name: str, db: Session = Depends(get_db)):
    level = level.strip().lower()
    subject_name = subject_name.replace("-", " ").strip().lower()
    
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid level.")

    stmt = (
        select(Topic)
        .join(Subject, Topic.subject_id == Subject.id)
        .options(joinedload(Topic.subject))  # if you want subject data returned
        .where(
            func.lower(Topic.level) == level,
            func.lower(Subject.name) == subject_name
        )
        .order_by(Topic.week_number)
    )
    topics = db.execute(stmt).scalars().all()
    return topics



# ✅ Admin: Update a subject (normalize level and dept)
@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    subject_update: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    subject.name = subject_update.name.strip()
    subject.level = subject.level.strip().lower()
    if subject.department:
        subject.department = subject.department.strip().lower()

    db.commit()
    db.refresh(subject)
    return subject


# ✅ Admin: Delete a subject
@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{level}", response_model=List[SubjectOut])
def get_subjects_by_level(
    level: str,
    department: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    level = level.strip().lower()
    department = department.strip().lower()

    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid level.")

    query = db.query(Subject).filter(func.lower(Subject.level) == level)

    if department:
        # Filter by exact department or blank (for general subjects)
        query = query.filter(
            or_(
                func.lower(Subject.department) == department,
                Subject.department == None,
                func.length(func.trim(Subject.department)) == 0,
            )
        )
    else:
        # Only subjects without a department
        query = query.filter(
            or_(
                Subject.department == None,
                func.length(func.trim(Subject.department)) == 0,
            )
        )

    subjects = query.order_by(Subject.name.asc()).all()
    return subjects
