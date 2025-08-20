from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Dict, List
import re

from ..database import get_db
from ..models import TopicQuestion, Subject, Topic, StudentProfile, User
from ..dependencies import get_current_student_user
from ..schemas import TopicQuestionOut, AnswerCheckRequest, AnswerCheckResponse

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

# ──────────────────────────────────────────────────────────────
# 🔧 Helper to Build Options for Objective Questions
# ──────────────────────────────────────────────────────────────
def build_options(q):
    if all([q.option_a, q.option_b, q.option_c, q.option_d]):
        return {
            "a": q.option_a,
            "b": q.option_b,
            "c": q.option_c,
            "d": q.option_d,
        }
    return None

# ──────────────────────────────────────────────────────────────
# 📚 Get Student Quizzes by Subject
# ──────────────────────────────────────────────────────────────
@router.get("/me", response_model=Dict[str, Dict[str, List[TopicQuestionOut]]])
def get_student_quizzes(
    current_user: User = Depends(get_current_student_user),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    level = (current_user.level or "").strip().lower()
    department = (current_user.department or "").strip().lower()

    if not level:
        raise HTTPException(status_code=400, detail="Student level is missing in user profile.")

    # Filter subjects by level and (if applicable) department
    if level in {"ss1", "ss2", "ss3"} and department:
        subjects = db.query(Subject).filter(
            func.lower(Subject.level) == level,
            or_(
                func.lower(Subject.department) == department,
                Subject.department == None,
                func.length(func.trim(Subject.department)) == 0
            )
        ).all()
    else:
        subjects = db.query(Subject).filter(func.lower(Subject.level) == level).all()

    quizzes_by_subject: Dict[str, Dict[str, List[TopicQuestionOut]]] = {}

    for subject in subjects:
        subject_name = subject.name.strip()
        # Get topics where subject_id matches AND level matches
        topics = db.query(Topic).filter(
            Topic.subject_id == subject.id,
            func.lower(Topic.level) == level
        ).all()

        topic_ids = [t.id for t in topics]
        if not topic_ids:
            quizzes_by_subject[subject_name] = {"objective": [], "theory": []}
            continue

        questions = db.query(TopicQuestion).filter(
            TopicQuestion.topic_id.in_(topic_ids)
        ).all()

        objective_questions = []
        theory_questions = []

        for q in questions:
            out = TopicQuestionOut(
                id=q.id,
                topic_id=q.topic_id,
                question=q.question,
                answer=q.answer,
                correct_answer=q.correct_answer,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                question_type=q.question_type,
                options=build_options(q),
            )

            if q.question_type and q.question_type.strip().lower() == "theory":
                theory_questions.append(out)
            else:
                objective_questions.append(out)

        quizzes_by_subject[subject_name] = {
            "objective": objective_questions,
            "theory": theory_questions
        }

    return quizzes_by_subject

# ──────────────────────────────────────────────────────────────
# 🧠 Loose Match Logic for Theory Questions
# ──────────────────────────────────────────────────────────────
def normalize_text(text: str) -> str:
    return re.sub(r'[^\w\s]', '', text).strip().lower()

def loose_match(student_answer: str, correct_answer: str) -> bool:
    student_words = set(normalize_text(student_answer).split())
    correct_words = set(normalize_text(correct_answer).split())
    if not correct_words:
        return False
    match_ratio = len(student_words.intersection(correct_words)) / len(correct_words)
    return match_ratio >= 0.6

# ──────────────────────────────────────────────────────────────
# ✅ Check Student Answer Endpoint
# ──────────────────────────────────────────────────────────────
@router.post("/check-answer", response_model=AnswerCheckResponse)
def check_student_answer(
    payload: AnswerCheckRequest,
    db: Session = Depends(get_db)
):
    question = db.query(TopicQuestion).filter_by(id=payload.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = False
    correct_answer = question.correct_answer or ""

    if question.question_type.lower() == "objective":
        student_answer = (payload.answer or "").strip().lower()
        correct_value = correct_answer.strip().lower()
        is_correct = student_answer == correct_value

    elif question.question_type.lower() == "theory":
        student_answer = payload.answer or ""
        is_correct = loose_match(student_answer, correct_answer)

    return AnswerCheckResponse(
        is_correct=is_correct,
        correct_answer=None if is_correct else correct_answer
    )
