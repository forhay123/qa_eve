from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TestResult, ExamResult
from ..dependencies import get_current_user
from . import progress  # Import progress router to use its helper functions

router = APIRouter(prefix="/achievements", tags=["Achievements"])

@router.get("/")
def get_achievements(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    student_id = user.id

    # Fetch test and exam results
    tests = db.query(TestResult).filter(TestResult.user_id == student_id).all()
    exams = db.query(ExamResult).filter(ExamResult.user_id == student_id).all()

    # Reuse logic from progress module (all sync functions)
    topic_progress = progress.get_my_topic_progress(db=db, user=user)
    daily_progress = progress.get_my_daily_progress(db=db, user=user)
    weekly_progress = progress.get_my_weekly_progress(db=db, user=user)

    return {
        "tests": tests,
        "exams": exams,
        "topic_progress": topic_progress,
        "daily_progress": daily_progress,
        "weekly_progress": weekly_progress
    }
