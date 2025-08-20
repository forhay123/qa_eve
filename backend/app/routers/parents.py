from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_

from ..database import get_db
from ..models import User, ParentChildAssociation, ProgressTracking, Topic, Subject, Attendance, ReportCard, StudentProfile
from ..schemas import (
    ParentChildAssociationCreate, ParentChildAssociationOut, ParentChildAssociationUpdate,
    BasicUserOut, DailyProgressOut, SubjectPerformanceOut, ProgressOut, AttendanceOut,
    ReportPreviewOut, ReportStudentInfo, SubjectScore, AttendanceSummary # ✅ AttendanceSummary imported
)
from ..auth import get_current_user
from pydantic import BaseModel, validator # BaseModel and validator are needed for local schema definitions if you had them, but for imports, they might not be strictly necessary here if all schemas are in schemas.py

router = APIRouter(prefix="/parents", tags=["Parents"])

# --- Parent Specific Endpoints ---

@router.post("/link-child", response_model=ParentChildAssociationOut, status_code=status.HTTP_201_CREATED)
async def link_child_to_parent(
    child_data: ParentChildAssociationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can link children."
        )

    if current_user.id == child_data.child_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot link yourself as your child."
        )

    child_user = db.query(User).filter(User.id == child_data.child_id, User.role == "student").first()
    if not child_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found or is not a student user."
        )
    
    existing_association = db.query(ParentChildAssociation).filter(
        ParentChildAssociation.parent_id == current_user.id,
        ParentChildAssociation.child_id == child_data.child_id
    ).first()

    if existing_association:
        detail_msg = "Association already exists for this parent and child."
        if not existing_association.approved:
            detail_msg = "Link request for this child is already pending approval."
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail_msg
        )

    db_association = ParentChildAssociation(
        parent_id=current_user.id,
        child_id=child_data.child_id,
        approved=False # Admin approval required
    )
    db.add(db_association)
    db.commit()
    db.refresh(db_association)
    
    return db_association

@router.get("/my-children", response_model=List[ParentChildAssociationOut])
async def get_my_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can view their children."
        )
    
    children_associations = db.query(ParentChildAssociation).options(
        joinedload(ParentChildAssociation.child)
    ).filter(ParentChildAssociation.parent_id == current_user.id).all()
    
    return children_associations

@router.get("/admin/pending-approvals", response_model=List[ParentChildAssociationOut])
async def get_pending_parent_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")
    
    pending_associations = db.query(ParentChildAssociation).options(
        joinedload(ParentChildAssociation.parent),
        joinedload(ParentChildAssociation.child)
    ).filter(ParentChildAssociation.approved == False).all()
    
    return pending_associations

@router.put("/admin/approve-child/{association_id}", response_model=ParentChildAssociationOut)
async def approve_child_association(
    association_id: int,
    approval_status: ParentChildAssociationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")

    association = db.query(ParentChildAssociation).options(
        joinedload(ParentChildAssociation.parent),
        joinedload(ParentChildAssociation.child)
    ).filter(ParentChildAssociation.id == association_id).first()

    if not association:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Association not found")

    association.approved = approval_status.approved
    db.commit()
    db.refresh(association)
    return association

@router.get("/search-students", response_model=List[BasicUserOut])
async def search_students(
    query: Optional[str] = None,
    student_class: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["parent", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    students_query = db.query(User).filter(User.role == "student")

    if query:
        students_query = students_query.filter(
            (User.full_name.ilike(f"%{query}%")) |
            (User.username.ilike(f"%{query}%")) |
            (User.email.ilike(f"%{query}%"))
        )
    if student_class:
        students_query = students_query.filter(User.level.ilike(f"%{student_class}%"))
    
    students = students_query.limit(20).all()
    
    linked_children_ids = [
        assoc.child_id for assoc in db.query(ParentChildAssociation)
        .filter(ParentChildAssociation.parent_id == current_user.id).all()
    ]
    
    unlinked_students = [
        BasicUserOut.from_orm(student) for student in students
        if student.id not in linked_children_ids
    ]
    return unlinked_students

@router.get("/child-performance/{child_id}", response_model=List[ProgressOut])
async def get_child_performance(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view child performance.")

    association = db.query(ParentChildAssociation).filter(
        ParentChildAssociation.parent_id == current_user.id,
        ParentChildAssociation.child_id == child_id,
        ParentChildAssociation.approved == True
    ).first()

    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not linked to this child or the link is not yet approved."
        )

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
        .filter(ProgressTracking.user_id == child_id)
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

@router.get("/child-daily-progress/{child_id}", response_model=List[DailyProgressOut])
async def get_child_daily_progress(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view child daily progress.")

    association = db.query(ParentChildAssociation).filter(
        ParentChildAssociation.parent_id == current_user.id,
        ParentChildAssociation.child_id == child_id,
        ParentChildAssociation.approved == True
    ).first()

    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not linked to this child or the link is not yet approved."
        )
    
    past_week = datetime.utcnow() - timedelta(days=7)

    progress = (
        db.query(
            func.date(ProgressTracking.completed_at).label("day"),
            func.sum(ProgressTracking.score).label("total_score"),
            func.sum(ProgressTracking.total_questions).label("total_questions")
        )
        .filter(
            ProgressTracking.user_id == child_id,
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

@router.get("/child-subject-performance/{child_id}", response_model=List[SubjectPerformanceOut])
async def get_child_subject_performance(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view child subject performance.")

    association = db.query(ParentChildAssociation).filter(
        ParentChildAssociation.parent_id == current_user.id,
        ParentChildAssociation.child_id == child_id,
        ParentChildAssociation.approved == True
    ).first()

    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not linked to this child or the link is not yet approved."
        )

    results = db.query(
        Subject.name.label("subject_name"),
        func.coalesce(func.sum(ProgressTracking.score), 0).label("total_score"),
        func.coalesce(func.sum(ProgressTracking.total_questions), 0).label("total_questions")
    ).join(Topic, ProgressTracking.topic_id == Topic.id) \
     .join(Subject, Topic.subject_id == Subject.id) \
     .filter(ProgressTracking.user_id == child_id) \
     .group_by(Subject.name).all()

    return [
        SubjectPerformanceOut(
            subject_name=row.subject_name,
            average_score=(row.total_score / row.total_questions * 100) if row.total_questions else 0.0
        ) for row in results
    ]

## **✅ NEW PARENT ENDPOINT: Fetch Child Attendance**
@router.get("/child-attendance/{child_id}", response_model=List[AttendanceOut])
async def get_child_attendance_for_parent(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parent fetches their linked child's attendance records.
    """
    if current_user.role != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view child attendance.")

    # Verify child is linked to the current parent and approved
    association = db.query(ParentChildAssociation).filter(
        ParentChildAssociation.parent_id == current_user.id,
        ParentChildAssociation.child_id == child_id,
        ParentChildAssociation.approved == True
    ).first()

    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not linked to this child or the link is not yet approved."
        )

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == child_id
    ).order_by(Attendance.date.desc()).all()

    return [AttendanceOut.from_orm(record) for record in attendance_records]

@router.get("/child-report-card/{child_id}", response_model=ReportPreviewOut)
async def get_child_report_card_for_parent(
    child_id: int,
    term: str = Query(..., description="Term (e.g., 'First Term', 'Second Term', 'Third Term')"),
    year: int = Query(..., description="Academic Year (e.g., 2025)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can view child report cards."
        )

    association = db.query(ParentChildAssociation).filter(
        ParentChildAssociation.parent_id == current_user.id,
        ParentChildAssociation.child_id == child_id,
        ParentChildAssociation.approved.is_(True)
    ).first()

    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not linked to this child or the link is not yet approved."
        )

    child_user = db.query(User).filter(User.id == child_id).first()
    if not child_user:
        raise HTTPException(status_code=404, detail="Child user not found.")

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == child_id
    ).first()
    if not student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    report_card_entries = db.query(ReportCard).filter(
        and_(
            ReportCard.student_id == child_id,
            ReportCard.term.ilike(term),
            ReportCard.year == year
        )
    ).all()

    if not report_card_entries:
        raise HTTPException(
            status_code=404,
            detail="No report card found for this child, term, and year."
        )

    subject_scores_list = [
        SubjectScore(
            subject=entry.subject,
            first_test_score=entry.first_test_score,
            second_test_score=entry.second_test_score,
            exam_score=entry.exam_score,
            first_test_percentage=(entry.first_test_score / 20 * 100) if entry.first_test_score is not None else 0.0,
            second_test_percentage=(entry.second_test_score / 20 * 100) if entry.second_test_score is not None else 0.0,
            exam_percentage=(entry.exam_score / 60 * 100) if entry.exam_score is not None else 0.0,
            total=entry.score,
            comment=entry.comment
        )
        for entry in report_card_entries
    ]

    # ✅ Define accurate term date ranges
    term = term.lower().strip()

    try:
        if term == "term_1":
            term_start = datetime(year, 6, 9)
            term_end = datetime(year, 9, 15)
        elif term == "term_2":
            term_start = datetime(year, 9, 23)
            term_end = datetime(year, 12, 15)
        elif term == "term_3":
            term_start = datetime(year + 1, 1, 8)
            term_end = datetime(year + 1, 4, 12)
        else:
            raise ValueError()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid term format. Use 'term_1', 'term_2', or 'term_3'."
        )

    # 🔍 Logging term boundaries
    print("📅 Term:", term)
    print("🧑‍🎓 Child ID:", child_id)
    print("⏳ Term Start:", term_start)
    print("⏳ Term End:", term_end)

    # ✅ Attendance filtering using real term boundaries
    attendance_result = db.query(
        func.count().label("total_days"),
        func.count().filter(Attendance.status == "present").label("present"),
        func.count().filter(Attendance.status == "absent").label("absent"),
        func.count().filter(Attendance.status == "late").label("late"),
        func.count().filter(Attendance.status == "excused").label("excused")
    ).filter(
        and_(
            Attendance.student_id == child_id,
            Attendance.date >= term_start,
            Attendance.date <= term_end
        )
    ).one()

    # 🔍 Logging raw DB result
    print("📊 Raw Attendance Counts:", attendance_result)

    # ✅ Fix: Access the values by index
    attendance_summary = AttendanceSummary(
        total_days=int(attendance_result[0] or 0),
        present=int(attendance_result[1] or 0),
        absent=int(attendance_result[2] or 0),
        late=int(attendance_result[3] or 0),
        excused=int(attendance_result[4] or 0),
        teachers_present=0
    )

    # 🔍 Logging the structured summary before return
    print("✅ Final Attendance Summary:", attendance_summary.model_dump())

    student_info = ReportStudentInfo(
        full_name=child_user.full_name,
        guardian_name=student_profile.guardian_name,
        contact_number=student_profile.contact_number or "N/A",
        address=student_profile.address or "N/A",
        profile_image=student_profile.profile_image,
        date_of_birth=str(student_profile.date_of_birth) if student_profile.date_of_birth else None,
        state_of_origin=student_profile.state_of_origin,
        gender=student_profile.gender
    )

    return ReportPreviewOut(
        student=student_info,
        term=term,
        year=year,
        level=child_user.level,
        attendance=AttendanceSummary.model_validate(attendance_summary.model_dump()),  # ✅ Enforce schema validation
        subjects=subject_scores_list
    )
