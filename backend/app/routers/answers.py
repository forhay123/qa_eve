from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal, ROUND_HALF_UP
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..services.answer_checker import check_answer

router = APIRouter(prefix="/answers", tags=["Answers"])

# ✅ Topic-Level Quiz Submission
@router.post("/submit-answers/")
def submit_answers(
    submission: schemas.SubmitAnswersRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    user_id = user.id
    topic_id = submission.topic_id
    answers = submission.answers

    if not answers:
        raise HTTPException(status_code=400, detail="No answers submitted.")

    submitted_ids = [ans.question_id for ans in answers]
    valid_ids = db.query(models.TopicQuestion.id).filter(
        models.TopicQuestion.id.in_(submitted_ids),
        models.TopicQuestion.topic_id == topic_id
    ).all()
    valid_ids_set = {id for (id,) in valid_ids}
    invalid_ids = [qid for qid in submitted_ids if qid not in valid_ids_set]
    if invalid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid question IDs: {invalid_ids}"
        )

    total = len(answers)
    correct = 0
    results = []

    for ans in answers:
        question = db.query(models.TopicQuestion).filter_by(id=ans.question_id, topic_id=topic_id).first()
        if not question:
            continue

        if question.option_a and question.correct_answer:
            expected = question.correct_answer.strip().lower()
            user_ans = ans.answer.strip().lower()
            is_correct = expected == user_ans
            similarity = 1.0 if is_correct else 0.0
            correction = None if is_correct else f"Correct answer: {expected}"
        else:
            is_correct, correction, similarity = check_answer(ans.answer, question.answer)

        db.add(models.UserAnswer(
            user_id=user_id,
            question_id=ans.question_id,
            answer=ans.answer,
            is_correct=is_correct,
            correction=correction,
            similarity=similarity
        ))

        if is_correct:
            correct += 1

        results.append({
            "question_id": question.id,
            "question_text": question.question,
            "your_answer": ans.answer,
            "correct_answer": question.correct_answer or question.answer,
            "is_correct": is_correct,
            "similarity": round(similarity, 3),
            "correction": correction
        })

    db.add(models.ProgressTracking(
        user_id=user_id,
        topic_id=topic_id,
        score=correct,
        total_questions=total
    ))

    db.commit()

    return {
        "message": "Answers submitted successfully",
        "score": correct,
        "total": total,
        "results": results
    }


@router.post("/submit-test/")
def submit_test_or_exam(
    submission: schemas.SubmitTestAnswers,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    user_id = user.id
    level = user.level.strip().lower()
    subject = submission.subject.strip().lower().replace("-", " ")  # 🔧 Fix: normalize
    test_type = submission.test_type.strip().lower()
    answers = submission.answers

    if not answers:
        raise HTTPException(status_code=400, detail="No answers submitted.")

    existing = (
        db.query(models.ExamResult)
        .filter_by(user_id=user_id, subject=subject, level=level)
        .first()
        if test_type == "exam"
        else db.query(models.TestResult)
        .filter_by(user_id=user_id, subject=subject, level=level, test_type=test_type)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You have already taken this {test_type} for {subject.capitalize()}."
        )

    week_ranges = {
        "first": (1, 6),
        "second": (7, 11),
        "exam": (1, 13)
    }

    if test_type not in week_ranges:
        raise HTTPException(status_code=400, detail="Invalid test_type. Must be 'first', 'second', or 'exam'.")

    start_week, end_week = week_ranges[test_type]

    topics = db.query(models.Topic).join(models.Subject).filter(
        func.lower(models.Subject.name) == subject,
        func.lower(models.Topic.level) == level,
        models.Topic.week_number >= start_week,
        models.Topic.week_number <= end_week
    ).all()

    if not topics:
        raise HTTPException(status_code=404, detail=f"No topics found for {subject} ({level}) in weeks {start_week}-{end_week}")

    topic_ids = [t.id for t in topics]

    questions = db.query(models.TopicQuestion).filter(
        models.TopicQuestion.topic_id.in_(topic_ids)
    ).all()

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for selected topics.")

    all_ids_set = {q.id for q in questions}
    total = len(all_ids_set)
    correct = 0

    for ans in answers:
        if ans.question_id not in all_ids_set:
            continue

        question = db.query(models.TopicQuestion).filter_by(id=ans.question_id).first()
        if not question:
            continue

        if question.option_a and question.correct_answer:
            expected = question.correct_answer.strip().lower()
            user_ans = ans.selected_option.strip().lower() if ans.selected_option else ""
            if user_ans == expected:
                correct += 1
        elif question.answer:
            expected = question.answer.strip().lower()
            user_ans = ans.user_answer.strip().lower() if ans.user_answer else ""
            if user_ans == expected:
                correct += 1

    percentage = (
        (Decimal(correct) / Decimal(total) * Decimal("100"))
        .quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if total > 0 else Decimal("0.00")
    )

    result_model = models.ExamResult if test_type == "exam" else models.TestResult
    result = result_model(
        user_id=user_id,
        subject=subject,
        level=level,
        test_type=test_type,
        total_score=correct,
        total_questions=total,
        percentage=percentage
    )
    db.add(result)
    db.commit()

    return {
        "message": f"{test_type.capitalize()} submitted",
        "score": correct,
        "total": total,
        "percentage": float(percentage)
    }


@router.get("/check-submission/")
def check_submission(
    subject: str,
    test_type: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    subject = subject.strip().lower().replace("-", " ")  # 🔧 Fix: normalize
    test_type = test_type.strip().lower()
    level = user.level.strip().lower()
    user_id = user.id

    existing = (
        db.query(models.ExamResult)
        .filter_by(user_id=user_id, subject=subject, level=level)
        .first()
        if test_type == "exam" else
        db.query(models.TestResult)
        .filter_by(user_id=user_id, subject=subject, level=level, test_type=test_type)
        .first()
    )

    return {"already_taken": existing is not None}
