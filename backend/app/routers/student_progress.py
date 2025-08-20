# routes/student_progress.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..dependencies import get_current_user
from ..models import ProgressTracking, Topic, Subject
from ..schemas import ProgressOut

router = APIRouter(prefix="/student", tags=["Student Progress"])

@router.get("/results", response_model=List[ProgressOut])
def get_student_results(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Fetch records with related topic and subject using joinedload
    records = db.query(ProgressTracking)\
        .filter(ProgressTracking.user_id == current_user.id)\
        .options(
            joinedload(ProgressTracking.topic).joinedload(Topic.subject)
        )\
        .all()

    return [
        ProgressOut(
            id=record.id,
            user_id=record.user_id,
            topic_id=record.topic_id,
            score=record.score,
            total_questions=record.total_questions,
            subject_name=record.topic.subject.name if record.topic and record.topic.subject else None,
            topic_title=record.topic.title if record.topic else None,
            completed_at=record.completed_at
        )
        for record in records
    ]
