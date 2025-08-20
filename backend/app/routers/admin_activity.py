from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from .. import models, database, schemas
from ..dependencies import get_current_admin_user

router = APIRouter(
    prefix="/admin-activity",
    tags=["Admin Activity"]
)

@router.get("/dashboard", response_model=schemas.AdminDashboard)
def get_admin_dashboard_data(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_admin_user)
):
    now = datetime.utcnow()
    five_minutes_ago = now - timedelta(minutes=5)

    # -----------------------------------
    # 1. Recent Logins (last 10 users)
    # -----------------------------------
    recent_users = (
        db.query(models.User)
        .filter(models.User.last_login != None)
        .filter(models.User.last_login >= five_minutes_ago)
        .order_by(models.User.last_login.desc())
        .all()
    )

    login_data = [
        schemas.RecentLogin(
            full_name=u.full_name,
            level=u.level,
            department=u.department,
            last_login=u.last_login.isoformat() if u.last_login else None
        )
        for u in recent_users
    ]

    # ----------------------------------------------------
    # 2. Currently Online Students (active within 5 minutes)
    # ----------------------------------------------------
    online_students = (
        db.query(models.User)
        .filter(models.User.role == "student")
        .filter(models.User.last_login.isnot(None))
        .filter(models.User.last_login >= five_minutes_ago)
        .order_by(models.User.last_login.desc())
        .all()
    )

    online_data = [
        schemas.RecentLogin(
            full_name=u.full_name,
            level=u.level,
            department=u.department,
            last_login=u.last_login.isoformat() if u.last_login else None
        )
        for u in online_students
    ]

    # ----------------------------------------------------------
    # 3. Top Performing Students with joinedload optimization
    # ----------------------------------------------------------
    students = (
        db.query(models.User)
        .filter(models.User.role == "student")
        .options(
            joinedload(models.User.progress),
            joinedload(models.User.assignment_submissions),
            joinedload(models.User.test_results),
            joinedload(models.User.exam_results)
        )
        .all()
    )

    top_students = []

    for student in students:
        # Quiz Scores (from progress tracking)
        quiz_scores = [
            (p.score / p.total_questions) * 100
            for p in student.progress if p.total_questions
        ]

        # Assignment Scores
        assignment_scores = [
            s.score for s in student.assignment_submissions if s.score is not None
        ]

        # Test Scores
        test_scores = [
            float(t.percentage) for t in student.test_results if t.percentage is not None
        ]

        # Exam Scores
        exam_scores = [
            float(e.percentage) for e in student.exam_results if e.percentage is not None
        ]

        # Average Score
        all_scores = quiz_scores + assignment_scores + test_scores + exam_scores
        if all_scores:
            average_score = round(sum(all_scores) / len(all_scores), 2)

            top_students.append(
                schemas.TopStudent(
                    full_name=student.full_name,
                    level=student.level,
                    department=student.department,
                    average_score=average_score,
                    quiz_score=round(sum(quiz_scores) / len(quiz_scores), 2) if quiz_scores else None,
                    assignment_score=round(sum(assignment_scores) / len(assignment_scores), 2) if assignment_scores else None,
                    test_score=round(sum(test_scores) / len(test_scores), 2) if test_scores else None,
                    exam_score=round(sum(exam_scores) / len(exam_scores), 2) if exam_scores else None,
                )
            )

    # Sort top students by average score
    sorted_top_students = sorted(top_students, key=lambda s: s.average_score, reverse=True)[:5]

    return schemas.AdminDashboard(
        logins=login_data,
        onlineStudents=online_data,
        topStudents=sorted_top_students
    )
