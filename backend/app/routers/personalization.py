from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import List

from ..database import get_db
from ..models import ProgressTracking, User, Attendance, Topic, Subject
from ..schemas import PersonalizedRecommendations, TopicOut
from ..auth import get_current_user

router = APIRouter(prefix="/personalization", tags=["Personalization"])


@router.get("/recommendations", response_model=PersonalizedRecommendations)
def get_personalized_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get recent weak topic performances (score < 50)
    weak_progress = (
        db.query(ProgressTracking)
        .filter(
            ProgressTracking.user_id == user.id,
            ProgressTracking.score < 50
        )
        .order_by(ProgressTracking.completed_at.desc())
        .limit(5)
        .all()
    )
    weak_topic_ids = [p.topic_id for p in weak_progress]

    # 2. Fetch those topics with their subject relationship eagerly loaded
    weak_topics = []
    if weak_topic_ids:
        weak_topics = (
            db.query(Topic)
            .options(joinedload(Topic.subject))
            .filter(Topic.id.in_(weak_topic_ids))
            .all()
        )

    # 3. Attendance in past 14 days
    fourteen_days_ago = datetime.utcnow().date() - timedelta(days=14)

    recent_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == user.id,
            Attendance.date >= fourteen_days_ago
        )
        .all()
    )

    # 4. Count missed (absent) days
    missed_days = sum(1 for a in recent_attendance if a.status.lower() == "absent")

    # 5. Determine risk level
    if missed_days >= 5 or len(weak_progress) >= 3:
        risk_level = "High"
    elif missed_days >= 3:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    # 6. Return result with Pydantic ORM models
    return PersonalizedRecommendations(
        recommended_topics=[TopicOut.from_orm(t) for t in weak_topics],
        risk_level=risk_level,
        missed_days=missed_days
    )