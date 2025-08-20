from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
from io import StringIO
import csv

from .. import models, schemas
from ..dependencies import get_db, get_current_user, get_current_admin_user
from ..models import ProgressTracking, Topic, User, Subject


router = APIRouter(
    prefix="/progress",
    tags=["Progress Tracking"]
)

TERM_START_DATE = datetime(2025, 6, 9)

# ----------- User-specific endpoints ------------

@router.get("/my-progress", response_model=List[schemas.ProgressOut])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    progress = (
        db.query(
            ProgressTracking.id,
            ProgressTracking.user_id,
            ProgressTracking.topic_id,
            ProgressTracking.score,
            ProgressTracking.total_questions,
            ProgressTracking.completed_at,
            Topic.title.label("topic_title"),
            Subject.name.label("subject_name")
        )
        .join(Topic, ProgressTracking.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .filter(ProgressTracking.user_id == current_user.id)
        .all()
    )

    return [
        schemas.ProgressOut(
            id=row.id,
            user_id=row.user_id,
            topic_id=row.topic_id,
            score=row.score,
            total_questions=row.total_questions,
            completed_at=row.completed_at,
            topic_title=row.topic_title,
            subject_name=row.subject_name
        )
        for row in progress
    ]



@router.get("/my-topic-progress", response_model=List[schemas.TopicProgressOut])
def get_my_topic_progress(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    progress = (
        db.query(
            Topic.title.label("topic_title"),
            Subject.name.label("subject_name"),
            func.coalesce(func.sum(ProgressTracking.score), 0).label("total_score"),
            func.coalesce(func.sum(ProgressTracking.total_questions), 0).label("total_questions")
        )
        .join(Topic, ProgressTracking.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .filter(ProgressTracking.user_id == user.id)
        .group_by(Topic.title, Subject.name)
        .all()
    )

    return [
        schemas.TopicProgressOut(
            topic_title=row.topic_title,
            subject_name=row.subject_name,
            total_score=row.total_score,
            total_questions=row.total_questions
        )
        for row in progress
    ]



@router.get("/my-daily-progress", response_model=List[schemas.DailyProgressOut])
def get_my_daily_progress(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    past_week = datetime.utcnow() - timedelta(days=7)

    progress = (
        db.query(
            func.date(ProgressTracking.completed_at).label("day"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .filter(
            ProgressTracking.user_id == user.id,
            ProgressTracking.completed_at >= past_week
        )
        .group_by(func.date(ProgressTracking.completed_at))
        .order_by(func.date(ProgressTracking.completed_at))
        .all()
    )

    return [
        schemas.DailyProgressOut(
            date=row.day,
            total_score=row.total_score,
            total_questions=row.total_questions
        )
        for row in progress
    ]


@router.get("/my-weekly-progress", response_model=List[schemas.WeeklyProgressOut])
def get_my_weekly_progress(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    progress_data = (
        db.query(
            func.floor(func.extract('epoch', (ProgressTracking.completed_at - TERM_START_DATE)) / 604800)
            .label("week_number"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .filter(ProgressTracking.user_id == user.id)
        .filter(ProgressTracking.completed_at >= TERM_START_DATE)
        .group_by("week_number")
        .order_by("week_number")
        .all()
    )

    return [
        schemas.WeeklyProgressOut(
            week=f"Week {int(row.week_number) + 1}",
            total_score=row.total_score,
            total_questions=row.total_questions
        )
        for row in progress_data
    ]



# ----------- Admin-specific endpoints ------------

@router.get("/admin/analytics", response_model=schemas.AdminAnalyticsResponse)
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    subject_average = (
        db.query(
            Subject.name.label("subject"),
            func.avg(ProgressTracking.score).label("avg_score")
        )
        .join(Topic, ProgressTracking.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .group_by(Subject.name)
        .all()
    )

    student_topic_scores = (
        db.query(
            User.id.label("user_id"),
            User.username.label("username"),
            Topic.title.label("topic"),
            Subject.name.label("subject"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .join(User, ProgressTracking.user_id == User.id)
        .join(Topic, ProgressTracking.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .group_by(User.id, Topic.id, Subject.name, Topic.title)
        .all()
    )

    recent_days = datetime.utcnow() - timedelta(days=14)
    daily_progress = (
        db.query(
            func.date(ProgressTracking.completed_at).label("day"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .filter(ProgressTracking.completed_at >= recent_days)
        .group_by(func.date(ProgressTracking.completed_at))
        .order_by(func.date(ProgressTracking.completed_at))
        .all()
    )

    return schemas.AdminAnalyticsResponse(
        subject_average=[schemas.SubjectAverage(subject=row.subject, avg_score=row.avg_score) for row in subject_average],
        student_topic_scores=[
            schemas.StudentTopicScore(
                user_id=row.user_id,
                username=row.username,
                topic=row.topic,
                subject=row.subject,
                total_score=row.total_score,
                total_questions=row.total_questions
            ) for row in student_topic_scores
        ],
        daily_progress=[
            schemas.DailyProgress(
                day=row.day,
                total_score=row.total_score,
                total_questions=row.total_questions
            ) for row in daily_progress
        ]
    )


@router.get("/all", response_model=List[schemas.StudentProgressSummary])
def get_all_student_progress(
    subject: str = Query(default=None),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    query = (
        db.query(
            User.id.label("user_id"),
            User.full_name.label("full_name"),
            User.level.label("level"),
            func.count(Topic.id).label("topics_covered"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .join(ProgressTracking, User.id == ProgressTracking.user_id)
        .join(Topic, ProgressTracking.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
    )

    if subject:
        query = query.filter(Subject.name.ilike(subject))

    query = query.group_by(User.id)

    results = query.all()

    return [
        schemas.StudentProgressSummary(
            user_id=row.user_id,
            full_name=row.full_name,
            level=row.level,
            topics_covered=row.topics_covered,
            avg_score=(row.total_score / row.total_questions * 100) if row.total_questions else 0.0
        )
        for row in results
    ]


@router.get("/student/{user_id}", response_model=List[schemas.ProgressOut])
def get_progress_for_student(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    progress = (
        db.query(
            ProgressTracking.id,
            ProgressTracking.user_id,
            ProgressTracking.topic_id,
            ProgressTracking.score,
            ProgressTracking.total_questions,
            ProgressTracking.completed_at,
            Topic.title.label("topic_title"),
            Subject.name.label("subject_name")
        )
        .join(Topic, Topic.id == ProgressTracking.topic_id)
        .join(Subject, Topic.subject_id == Subject.id)
        .filter(ProgressTracking.user_id == user_id)
        .all()
    )

    return [
        schemas.ProgressOut(
            id=row.id,
            user_id=row.user_id,
            topic_id=row.topic_id,
            score=row.score,
            total_questions=row.total_questions,
            completed_at=row.completed_at,
            topic_title=row.topic_title or "Unknown",
            subject_name=row.subject_name or "Unknown"
        )
        for row in progress
    ]



@router.get("/summary")
def get_summary(
    subject: str = Query(default=None),
    user_id: int = Query(default=None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_admin and user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    else:
        user_id = current_user.id

    query = (
        db.query(
            func.to_char(ProgressTracking.completed_at, 'IYYY-"W"IW').label("week"),
            func.avg(ProgressTracking.score).label("avg_score")
        )
        .join(Topic, ProgressTracking.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .filter(ProgressTracking.user_id == user_id)
    )

    if subject:
        query = query.filter(Subject.name.ilike(f"%{subject}%"))

    results = (
        query.group_by(func.to_char(ProgressTracking.completed_at, 'IYYY-"W"IW'))
        .order_by(func.to_char(ProgressTracking.completed_at, 'IYYY-"W"IW'))
        .all()
    )

    return {"weekly": [{"week": r.week, "avg_score": r.avg_score} for r in results]}



@router.get("/export/csv")
def export_progress_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["User ID", "Topic ID", "Score", "Total Questions", "Completed At"])

    records = db.query(ProgressTracking).all()
    for record in records:
        writer.writerow([
            record.user_id,
            record.topic_id,
            record.score,
            record.total_questions,
            record.completed_at.strftime("%Y-%m-%d %H:%M:%S") if record.completed_at else ""
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=progress_tracking.csv"
    })



@router.get("/my-summary", response_model=schemas.MyProgressSummaryOut)
def get_my_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    total_topics = db.query(func.count(func.distinct(ProgressTracking.topic_id))) \
        .filter(ProgressTracking.user_id == user.id).scalar()

    completed_topics = db.query(func.count(func.distinct(ProgressTracking.topic_id))) \
        .filter(ProgressTracking.user_id == user.id, ProgressTracking.score >= ProgressTracking.total_questions) \
        .scalar()

    total_score, total_questions = db.query(
        func.coalesce(func.sum(ProgressTracking.score), 0),
        func.coalesce(func.sum(ProgressTracking.total_questions), 0)
    ).filter(ProgressTracking.user_id == user.id).first()

    avg_score = (total_score / total_questions * 100) if total_questions else 0.0

    return schemas.MyProgressSummaryOut(
        total_topics=total_topics,
        completed_topics=completed_topics,
        total_questions=total_questions,
        average_score=round(avg_score, 2)
    )



@router.get("/my-subject-summary", response_model=List[schemas.SubjectPerformanceOut])
def get_my_subject_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    results = db.query(
        Subject.name.label("subject_name"),
        func.coalesce(func.sum(ProgressTracking.score), 0).label("total_score"),
        func.coalesce(func.sum(ProgressTracking.total_questions), 0).label("total_questions")
    ).join(Topic, ProgressTracking.topic_id == Topic.id) \
     .join(Subject, Topic.subject_id == Subject.id) \
     .filter(ProgressTracking.user_id == user.id) \
     .group_by(Subject.name).all()

    return [
        schemas.SubjectPerformanceOut(
            subject_name=row.subject_name,
            average_score=(row.total_score / row.total_questions * 100) if row.total_questions else 0.0
        ) for row in results
    ]
