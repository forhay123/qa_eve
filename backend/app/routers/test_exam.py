from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import random
from math import ceil

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/tests",
    tags=["Tests and Exams"]
)

# -------------------- Utility: Format Question with Options --------------------

def build_question_out(q: models.TopicQuestion) -> schemas.TopicQuestionOut:
    options = {}
    for key in ['a', 'b', 'c', 'd']:
        val = getattr(q, f'option_{key}', None)
        if val:
            options[key] = val

    return schemas.TopicQuestionOut(
        id=q.id,
        topic_id=q.topic_id,
        question=q.question,
        answer=q.answer,
        correct_answer=q.correct_answer,
        option_a=q.option_a,
        option_b=q.option_b,
        option_c=q.option_c,
        option_d=q.option_d,
        options=options or None
    )

# -------------------- Test and Exam Endpoints --------------------

@router.get("/{level}/{subject}/first", response_model=List[schemas.TopicQuestionOut])
def get_first_test_questions(level: str, subject: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_test_questions(db, level, subject, 1, 6, user.id)

@router.get("/{level}/{subject}/second", response_model=List[schemas.TopicQuestionOut])
def get_second_test_questions(level: str, subject: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_test_questions(db, level, subject, 7, 11, user.id)

@router.get("/exams/{level}/{subject}", response_model=List[schemas.TopicQuestionOut])
def get_exam_questions(level: str, subject: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_exam_questions_logic(db, level, subject, user.id)

@router.get("/test-questions/", response_model=List[schemas.TopicQuestionOut])
def get_test_by_query(subject: str, level: str, test_type: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if test_type == "first":
        return get_test_questions(db, level, subject, 1, 6, user.id)
    elif test_type == "second":
        return get_test_questions(db, level, subject, 7, 11, user.id)
    elif test_type == "exam":
        return get_exam_questions_logic(db, level, subject, user.id)
    else:
        raise HTTPException(status_code=400, detail="Invalid test_type. Must be 'first', 'second', or 'exam'")

# -------------------- Question Logic --------------------

def get_test_questions(db: Session, level: str, subject: str, start_week: int, end_week: int, user_id: int):
    normalized_level = level.strip().lower()
    normalized_subject = subject.replace("-", " ").strip().lower()

    topics = db.query(models.Topic).join(models.Subject).filter(
        func.lower(models.Topic.level) == normalized_level,
        func.lower(models.Subject.name) == normalized_subject,
        models.Topic.week_number >= start_week,
        models.Topic.week_number <= end_week
    ).all()

    if not topics:
        raise HTTPException(
            status_code=404,
            detail=f"No topics found for {subject} ({level}) between weeks {start_week}-{end_week}"
        )

    topic_ids = [t.id for t in topics]

    all_questions = db.query(models.TopicQuestion).filter(
        models.TopicQuestion.topic_id.in_(topic_ids)
    ).all()

    if not all_questions:
        raise HTTPException(
            status_code=404,
            detail=f"No test questions found for {subject} ({level}) between weeks {start_week}-{end_week}"
        )

    answered_ids = db.query(models.UserAnswer.question_id).filter_by(user_id=user_id).all()
    answered_id_set = {qid for (qid,) in answered_ids}

    unanswered_questions = [q for q in all_questions if q.id not in answered_id_set]

    if not unanswered_questions:
        raise HTTPException(
            status_code=404,
            detail=f"You have already answered all test questions for {subject} ({level}) between weeks {start_week}-{end_week}"
        )

    question_count = max(1, ceil(len(unanswered_questions) * 0.4))
    selected = random.sample(unanswered_questions, question_count)

    return [build_question_out(q) for q in selected]

def get_exam_questions_logic(db: Session, level: str, subject: str, user_id: int):
    normalized_level = level.strip().lower()
    normalized_subject = subject.replace("-", " ").strip().lower()

    topics = db.query(models.Topic).join(models.Subject).filter(
        func.lower(models.Topic.level) == normalized_level,
        func.lower(models.Subject.name) == normalized_subject,
        models.Topic.week_number >= 1,
        models.Topic.week_number <= 13
    ).all()

    if not topics:
        raise HTTPException(
            status_code=404,
            detail=f"No topics found for {subject} ({level}) weeks 1–13"
        )

    topic_ids = [t.id for t in topics]

    all_questions = db.query(models.TopicQuestion).filter(
        models.TopicQuestion.topic_id.in_(topic_ids)
    ).all()

    if not all_questions:
        raise HTTPException(
            status_code=404,
            detail=f"No exam questions found for {subject} ({level}) weeks 1–13"
        )

    answered_ids = db.query(models.UserAnswer.question_id).filter_by(user_id=user_id).all()
    answered_id_set = {qid for (qid,) in answered_ids}

    unanswered_questions = [q for q in all_questions if q.id not in answered_id_set]

    if not unanswered_questions:
        raise HTTPException(
            status_code=404,
            detail=f"You have already answered all exam questions for {subject} ({level})"
        )

    random.shuffle(unanswered_questions)
    return [build_question_out(q) for q in unanswered_questions]
