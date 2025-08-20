from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models import User, TeacherSubject, Subject
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/classes", tags=["Classes"])

@router.get("/", response_model=List[str])
def get_teacher_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Query distinct subject.level (class names) assigned to this teacher
    class_levels = (
        db.query(Subject.level)
        .join(TeacherSubject, TeacherSubject.subject_id == Subject.id)
        .filter(TeacherSubject.teacher_id == current_user.id)
        .distinct()
        .all()
    )

    # Extract string values and filter out None or empty strings
    classes = [cl[0].upper() for cl in class_levels if cl[0]]

    return classes
