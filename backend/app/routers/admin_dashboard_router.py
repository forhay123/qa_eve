from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, load_only, joinedload
from sqlalchemy import func, or_, and_
from ..database import get_db
from ..models import User, Assignment, AssignmentSubmission, ProgressTracking, Topic, Subject, ScheduledEvent, Timetable
from ..dependencies import get_current_admin_user
from ..schemas import (TopicOut, ProgressOut, AssignmentOut, AssignmentSubmissionOut,
                        MyProgressSummaryOut, SimpleSubmissionOut, SimpleAssignmentOut,
    DashboardTopic,
    DashboardAssignment,
    DashboardProgress,
    DashboardEvent,
    StudentDashboardOut,
    SubjectOut,
    ScheduleItem, TimetableOut, DailyProgressOut, SubjectPerformanceOut,
    AdminStudentSummaryOut)
from typing import List
from datetime import datetime, date, timedelta
from calendar import day_name

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


# -------------------- Admin Fetch Student Dashboard --------------------

TERM_START_DATE = date(2025, 6, 9)

def get_current_term_week():
    today = datetime.now().date()
    delta_days = (today - TERM_START_DATE).days
    week = (delta_days // 7) + 1
    return max(1, week)

@router.get("/student-dashboard/{student_id}", response_model=StudentDashboardOut)
def get_admin_student_dashboard(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    try:
        # Fetch student
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        student_level = (student.level or "").strip().lower()
        student_department = (student.department or "").strip().lower()
        current_week = get_current_term_week()
        today = datetime.now().date()
        today_day_name = day_name[datetime.now().weekday()]

        # ------------------ Schedule ------------------
        timetable_entries = db.query(Timetable).join(Subject).filter(
            func.lower(Timetable.level) == student_level,
            func.lower(Timetable.day) == today_day_name.lower(),
            or_(
                func.lower(Timetable.department) == student_department,
                Timetable.department == None,
                Timetable.department == "",
            )
        ).order_by(Timetable.period).all()

        today_schedule = [
            TimetableOut(
                id=entry.id,
                day=entry.day,
                subject=entry.subject_rel.name if entry.subject_rel else "Unknown",
                start_time=str(entry.start_time),
                end_time=str(entry.end_time),
                level=entry.level,
                department=entry.department,
                period=entry.period
            )
            for entry in timetable_entries
        ]

        # ------------------ Topics ------------------
        dashboard_topics = []
        for entry in timetable_entries:
            topic = db.query(Topic).join(Subject).filter(
                Topic.subject_id == entry.subject_id,
                func.lower(Topic.level) == student_level,
                Topic.week_number == current_week,
                or_(
                    func.lower(Subject.department) == student_department,
                    Subject.department == None,
                    Subject.department == ""
                )
            ).first()

            dashboard_topics.append(
                DashboardTopic(
                    subject=entry.subject_rel.name if entry.subject_rel else "Unknown",
                    topic_title=topic.title if topic else "No topic available for this week.",
                    pdf_url=topic.pdf_url if topic else None,
                    start_time=str(entry.start_time),
                    end_time=str(entry.end_time)
                )
            )

        # ------------------ Assignments ------------------
        assignments = db.query(Assignment).join(Subject).options(joinedload(Assignment.subject)).filter(
            func.lower(Assignment.class_level) == student_level,
            or_(
                func.lower(Subject.department) == student_department,
                Subject.department == None,
                Subject.department == ""
            )
        ).all()

        dashboard_assignments = []
        for assignment in assignments:
            submission = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.student_id == student.id
            ).first()

            dashboard_assignments.append(
                DashboardAssignment(
                    id=assignment.id,
                    title=assignment.title,
                    due_date=assignment.due_date,
                    subject=SubjectOut.from_orm(assignment.subject),
                    status="completed" if submission else "pending",
                    score=submission.score if submission else None,
                    submitted_at=submission.submitted_at if submission else None
                )
            )

        # ------------------ Progress ------------------
        # Get total topics for the student's level
        total_topics_query = db.query(Topic).filter(
            func.lower(Topic.level) == student_level
        )
        total_topics_count = total_topics_query.count()

        # Count completed topics by the student
        completed_topics_count = db.query(ProgressTracking).filter(
            ProgressTracking.user_id == student.id
        ).count()

        dashboard_progress = DashboardProgress(
            total_topics_assigned=total_topics_count,
            topics_completed=completed_topics_count,
            topics_remaining=max(total_topics_count - completed_topics_count, 0)
        )

        # ------------------ Events ------------------
        upcoming_events = db.query(ScheduledEvent).filter(
            ScheduledEvent.date >= today
        ).order_by(ScheduledEvent.date).all()

        dashboard_events = [
            DashboardEvent(
                title=event.title,
                event_type=event.event_type,
                date=event.date,
                countdown_days=(event.date - today).days
            )
            for event in upcoming_events
        ]

        # ✅ FINAL return
        response = StudentDashboardOut(
            student_name=(student.full_name or "").strip() or None,
            date=today,
            current_week=current_week,
            today_topics=dashboard_topics,
            assignments=dashboard_assignments,
            progress=dashboard_progress,
            upcoming_events=dashboard_events,
            today_schedule=today_schedule or []
        )

        return response

    except Exception as e:
        import traceback
        print("🔥 Error in get_admin_student_dashboard:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Something went wrong fetching student dashboard.")


# -------------------- Admin Fetch Student Analytics --------------------

@router.get("/student-daily-progress/{student_id}", response_model=List[DailyProgressOut])
def get_admin_student_daily_progress(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin fetches student's daily progress for the past week
    """
    # Verify student exists
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    past_week = datetime.utcnow() - timedelta(days=7)

    progress = (
        db.query(
            func.date(ProgressTracking.completed_at).label("day"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .filter(
            ProgressTracking.user_id == student_id,
            ProgressTracking.completed_at >= past_week
        )
        .group_by(func.date(ProgressTracking.completed_at))
        .order_by(func.date(ProgressTracking.completed_at))
        .all()
    )

    return [
        DailyProgressOut(
            date=row.day,
            total_score=row.total_score,
            total_questions=row.total_questions
        )
        for row in progress
    ]

@router.get("/student-summary/{student_id}", response_model=MyProgressSummaryOut)
def get_admin_student_summary(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin fetches student's overall progress summary
    """
    # Verify student exists
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    total_topics = db.query(func.count(func.distinct(ProgressTracking.topic_id))) \
        .filter(ProgressTracking.user_id == student_id).scalar()

    completed_topics = db.query(func.count(func.distinct(ProgressTracking.topic_id))) \
        .filter(ProgressTracking.user_id == student_id, ProgressTracking.score >= ProgressTracking.total_questions) \
        .scalar()

    total_score, total_questions = db.query(
        func.coalesce(func.sum(ProgressTracking.score), 0),
        func.coalesce(func.sum(ProgressTracking.total_questions), 0)
    ).filter(ProgressTracking.user_id == student_id).first()

    avg_score = (total_score / total_questions * 100) if total_questions else 0.0

    return MyProgressSummaryOut(
        total_topics=total_topics,
        completed_topics=completed_topics,
        total_questions=total_questions,
        average_score=round(avg_score, 2)
    )

@router.get("/student-subject-summary/{student_id}", response_model=List[SubjectPerformanceOut])
def get_admin_student_subject_summary(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin fetches student's subject-wise performance summary
    """
    # Verify student exists
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    results = db.query(
        Subject.name.label("subject_name"),
        func.coalesce(func.sum(ProgressTracking.score), 0).label("total_score"),
        func.coalesce(func.sum(ProgressTracking.total_questions), 0).label("total_questions")
    ).join(Topic, ProgressTracking.topic_id == Topic.id) \
     .join(Subject, Topic.subject_id == Subject.id) \
     .filter(ProgressTracking.user_id == student_id) \
     .group_by(Subject.name).all()

    return [
        SubjectPerformanceOut(
            subject_name=row.subject_name,
            average_score=(row.total_score / row.total_questions * 100) if row.total_questions else 0.0
        ) for row in results
    ]


# -------------------- Admin Fetch Student Subjects --------------------

@router.get("/student-subjects", response_model=List[str])
def get_admin_student_subjects(
    level: str,
    department: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin fetches student subjects by level and department
    """
    if not level or not department:
        raise HTTPException(status_code=400, detail="Level and Department required")

    subjects = db.query(Subject).filter_by(level=level, department=department).all()
    return [sub.name for sub in subjects]


# -------------------- Admin Fetch Student Assignments --------------------
@router.get("/student-assignments/{student_id}", response_model=List[SimpleAssignmentOut])
def get_admin_student_assignments(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Safely normalize student's level and department
    student_level = (student.level or "").lower()
    student_department = (student.department or "").lower()

    assignments = (
        db.query(
            Assignment.id,
            Assignment.title,
            Assignment.description,
            Assignment.due_date
        )
        .join(Subject, Assignment.subject_id == Subject.id)
        .filter(
            func.lower(Assignment.class_level) == student_level,
            or_(
                func.lower(Subject.department) == student_department,
                Subject.department == None,
                Subject.department == ""
            )
        )
        .all()
    )

    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date
        } for a in assignments
    ]

@router.get("/student-submissions/{student_id}", response_model=List[SimpleSubmissionOut])
def get_admin_student_submissions(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    submissions = db.query(
        AssignmentSubmission.id,
        AssignmentSubmission.assignment_id,
        AssignmentSubmission.student_id,
        AssignmentSubmission.file_url,
        AssignmentSubmission.submitted_at,
        AssignmentSubmission.score,
        AssignmentSubmission.status
    ).filter(AssignmentSubmission.student_id == student_id).all()

    return [
        {
            "id": s.id,
            "assignment_id": s.assignment_id,
            "student_id": s.student_id,
            "file_url": s.file_url,
            "submitted_at": s.submitted_at,
            "score": s.score,
            "status": s.status
        } for s in submissions
    ]

# -------------------- Admin Fetch Student Progress --------------------

@router.get("/student-progress/{student_id}", response_model=List[ProgressOut])
def get_admin_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin fetches detailed topic progress of the student
    """
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
        .filter(ProgressTracking.user_id == student_id)
        .all()
    )

    return [
        ProgressOut(
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



@router.get("/student-summary/{user_id}", response_model=AdminStudentSummaryOut)
def get_student_summary(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin-only: Returns a summary of a student's performance including
    correct answers, wrong answers, total questions, and average score.
    """

    total_score, total_questions = db.query(
        func.coalesce(func.sum(ProgressTracking.score), 0),
        func.coalesce(func.sum(ProgressTracking.total_questions), 0)
    ).filter(ProgressTracking.user_id == user_id).first()

    total_score = total_score or 0
    total_questions = total_questions or 0

    correct_answers = int(total_score)
    wrong_answers = int(total_questions - total_score)
    average_score = round((total_score / total_questions * 100), 2) if total_questions else 0.0

    return AdminStudentSummaryOut(
        correct_answers=correct_answers,
        wrong_answers=wrong_answers,
        total_questions=total_questions,
        average_score=average_score
    )
