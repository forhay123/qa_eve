from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from sqlalchemy import func, or_
from ..models import (
    Timetable, Topic, ProgressTracking,
    Assignment, AssignmentSubmission,
    ScheduledEvent, Subject, User
)
from ..schemas import (
    StudentDashboardOut, DashboardTopic,
    DashboardAssignment, DashboardEvent,
    DashboardProgress
)


def get_student_dashboard_data(db: Session, current_user: User):
    today = date.today()

    if not current_user.level and not current_user.is_admin:
        raise HTTPException(status_code=400, detail="User level is required.")

    level = (current_user.level or "").strip().lower()
    department = (current_user.department or "").strip().lower()
    academic_week = get_academic_week_number()

    # ✅ 1️⃣ Timetable Entries (Today)
    if current_user.is_admin:
        timetable_entries = db.query(Timetable).filter(
            func.lower(Timetable.day) == today.strftime("%A").lower()
        ).order_by(Timetable.start_time).all()
    else:
        timetable_query = db.query(Timetable).filter(
            func.lower(Timetable.level) == level,
            func.lower(Timetable.day) == today.strftime("%A").lower()
        )

        # ✅ Only filter department if it's SS level
        if level.startswith("ss") and department:
            timetable_query = timetable_query.filter(
                or_(
                    func.lower(Timetable.department) == department,
                    func.length(Timetable.department) == 0,
                    Timetable.department == None
                )
            )

        timetable_entries = timetable_query.order_by(Timetable.start_time).all()

    # ✅ 2️⃣ Topics for Each Entry
    today_topics = []

    for entry in timetable_entries:
        subject = db.query(Subject).filter(Subject.id == entry.subject_id).first()
        if not subject:
            print(f"⚠️ No subject found for subject_id: {entry.subject_id}")
            continue

        try:
            current_topic = db.query(Topic).filter(
                Topic.subject_id == subject.id,
                func.lower(Topic.level) == func.lower(entry.level),
                Topic.week_number == academic_week
            ).first()

            if current_topic:
                today_topics.append(DashboardTopic(
                    subject=subject.name,
                    topic_title=current_topic.title,
                    pdf_url=current_topic.pdf_url,
                    start_time=entry.start_time,
                    end_time=entry.end_time,
                    is_current_week=True,
                    actual_week=academic_week,
                    topic_available=True
                ))
            else:
                fallback_topic = db.query(Topic).filter(
                    Topic.subject_id == subject.id,
                    func.lower(Topic.level) == func.lower(entry.level),
                    Topic.week_number < academic_week
                ).order_by(Topic.week_number.desc()).first()

                if fallback_topic:
                    today_topics.append(DashboardTopic(
                        subject=subject.name,
                        topic_title=fallback_topic.title,
                        pdf_url=fallback_topic.pdf_url,
                        start_time=entry.start_time,
                        end_time=entry.end_time,
                        is_current_week=False,
                        actual_week=fallback_topic.week_number,
                        topic_available=True
                    ))
                else:
                    today_topics.append(DashboardTopic(
                        subject=subject.name,
                        topic_title="No topic available for this week.",
                        pdf_url=None,
                        start_time=entry.start_time,
                        end_time=entry.end_time,
                        is_current_week=False,
                        actual_week=academic_week,
                        topic_available=False
                    ))

        except Exception as e:
            print(f"🔥 Error fetching topic for subject {subject.name}: {str(e)}")
            continue

    # ✅ 3️⃣ Assignments
    assignments_query = db.query(Assignment)
    if not current_user.is_admin:
        assignments_query = assignments_query.filter(
            func.lower(Assignment.class_level) == level
        )
    assignments = assignments_query.all()

    dashboard_assignments = []
    for assignment in assignments:
        submission = db.query(AssignmentSubmission).filter_by(
            assignment_id=assignment.id,
            student_id=current_user.id
        ).first()

        status = "completed" if submission else "pending"

        dashboard_assignments.append(DashboardAssignment(
            id=assignment.id,
            title=assignment.title,
            due_date=assignment.due_date,
            subject=assignment.subject,
            status=status
        ))

    # ✅ 4️⃣ Progress
    total_topics_query = db.query(Topic)
    if not current_user.is_admin:
        total_topics_query = total_topics_query.filter(
            func.lower(Topic.level) == level
        )
    total_topics_count = total_topics_query.count()

    completed_topics = db.query(ProgressTracking).filter_by(
        user_id=current_user.id
    ).count()

    dashboard_progress = DashboardProgress(
        total_topics_assigned=total_topics_count,
        topics_completed=completed_topics,
        topics_remaining=max(total_topics_count - completed_topics, 0)
    )

    # ✅ 5️⃣ Upcoming Events
    events = db.query(ScheduledEvent).filter(
        ScheduledEvent.date >= today
    ).order_by(ScheduledEvent.date).all()

    dashboard_events = [
        DashboardEvent(
            title=event.title,
            event_type=event.event_type,
            date=event.date,
            countdown_days=(event.date - today).days
        )
        for event in events
    ]

    return StudentDashboardOut(
        date=today,
        current_week=academic_week,
        today_topics=today_topics,
        assignments=dashboard_assignments,
        progress=dashboard_progress,
        upcoming_events=dashboard_events
    )


def get_academic_week_number():
    resumption_date = datetime(2025, 8, 3)
    today = datetime.now()
    delta_days = (today - resumption_date).days
    return max((delta_days // 7) + 1, 1)
