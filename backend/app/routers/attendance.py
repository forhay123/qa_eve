from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Dict
from datetime import date
import logging
from collections import defaultdict
from ..database import get_db
from .. import models, schemas, crud, dependencies
from ..dependencies import (
    get_current_user,
    get_current_admin_user,
    get_current_student_user,
    get_current_teacher_user,
)
from ..dependencies import require_teacher, validate_teacher_with_class


router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ========== ADMIN ROUTES ==========

@router.post("/mark", response_model=schemas.AttendanceOut)
def mark_attendance(
    data: schemas.AttendanceCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Admin marks attendance for a single student."""
    return crud.mark_attendance(
        db,
        student_id=data.student_id,
        status=data.status,
        day=data.date or date.today()
    )


@router.post("/bulk", response_model=List[schemas.AttendanceOut])
def bulk_mark_attendance(
    payload: schemas.BulkAttendanceRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Admin marks attendance for multiple students."""
    return crud.bulk_mark_attendance(
        db=db,
        records=payload.records,
        date_override=payload.date_override
    )


@router.get("/", response_model=List[schemas.AttendanceOut])
def list_all_attendance(
    date_filter: Optional[date] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Admin gets full attendance log with optional date filter."""
    return crud.get_all_attendance(db, date_filter)


@router.get("/date/{query_date}", response_model=List[schemas.AttendanceOut])
def get_attendance_by_date(
    query_date: date,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):
    """Admin: Get attendance records for a specific date."""
    records = db.query(models.Attendance).filter(models.Attendance.date == query_date).all()
    if not records:
        raise HTTPException(status_code=404, detail="No attendance records found.")
    return records


@router.get("/all", response_model=List[schemas.AttendanceOut])
def get_full_attendance(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):
    """Admin: Get all attendance records, ordered by class and date."""
    return (
        db.query(models.Attendance)
        .join(models.User)
        .order_by(models.User.student_class, models.Attendance.date.desc())
        .all()
    )


@router.get("/total-days")
def get_total_attendance_days(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Admin: Get total number of distinct attendance days."""
    try:
        total_days = db.query(func.count(func.distinct(models.Attendance.date))).scalar()
        return {"total_attendance_days": total_days or 0}
    except Exception as e:
        logging.error(f"Error fetching total attendance days: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get total attendance days")


@router.get("/summary")
def get_attendance_summary(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):
    """Admin: Get summary of all attendance records."""
    total_records = db.query(func.count(models.Attendance.id)).scalar() or 0
    total_days = db.query(func.count(func.distinct(models.Attendance.date))).scalar() or 0

    counts = (
        db.query(models.Attendance.status, func.count(models.Attendance.status))
        .group_by(models.Attendance.status)
        .all()
    )
    status_counts = {status: count for status, count in counts}

    return {
        "total_records": total_records,
        "total_days": total_days,
        "present": status_counts.get("present", 0),
        "absent": status_counts.get("absent", 0),
        "excused": status_counts.get("excused", 0),
        "late": status_counts.get("late", 0),
    }


@router.get("/by-date", response_model=List[schemas.AttendanceOut])
def get_attendance_by_date(
    date: date = Query(..., description="Date in YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    records = (
        db.query(models.Attendance)
        .join(models.Attendance.student)  # join to User
        .options(
            joinedload(models.Attendance.student)
            .joinedload(models.User.student_profile)  # keep lazy loading here
        )
        .filter(models.Attendance.date == date)
        .all()
    )
    return records


# ========== TEACHER ROUTES ==========




@router.get("/students-in-class", response_model=List[schemas.UserOut])
def get_students_in_teacher_class(
    db: Session = Depends(get_db),
    teacher_profile: models.TeacherProfile = Depends(get_current_teacher_user)
):
    """Get all students in the teacher's assigned class/level."""
    print(f"\n🔍 Getting students for teacher profile: Level={teacher_profile.level}, Department={teacher_profile.department}")
    
    if not teacher_profile.level:
        raise HTTPException(status_code=400, detail="Teacher is not assigned to any level/class")

    # Query students that match the teacher's assigned level
    query = db.query(models.User).filter(
        models.User.role == "student",
        models.User.level == teacher_profile.level
    )
    
    # If teacher has a specific department assignment (not "general"), filter by department too
    if teacher_profile.department and teacher_profile.department.lower() != "general":
        query = query.filter(models.User.department == teacher_profile.department)
    
    students = query.all()
    
    print(f"✅ Found {len(students)} students matching criteria")
    for student in students:
        print(f"  - {student.full_name} (Level: {student.level}, Department: {student.department})")
    
    return students





@router.get("/summary/class/{level}", response_model=List[Dict])
def get_class_attendance_summary(level: str, db: Session = Depends(get_db)):
    results = (
        db.query(
            models.User.full_name,
            db.func.count(models.Attendance.id).label("total_days"),
            db.func.count(db.case((models.Attendance.status == "present", 1))).label("present_days"),
            db.func.count(db.case((models.Attendance.status == "absent", 1))).label("absent_days"),
            db.func.count(db.case((models.Attendance.status == "excused", 1))).label("excused_days")
        )
        .join(models.Attendance, models.User.id == models.Attendance.student_id)
        .filter(models.User.level == level.lower(), models.User.role == "student")
        .group_by(models.User.full_name)
        .order_by(models.User.full_name)
        .all()
    )

    return [
        {
            "full_name": r[0],
            "total_days": r[1],
            "present_days": r[2],
            "absent_days": r[3],
            "excused_days": r[4],
            "attendance_percentage": round(100 * r[2] / r[1], 2) if r[1] > 0 else 0
        }
        for r in results
    ]



@router.get("/summary/total")
def get_total_class_attendance_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    try:
        profile = validate_teacher_with_class(db=db, user=current_user)
        print("📘 Teacher Profile:", profile.level, profile.department)

        # Step 1: Get students
        student_query = db.query(models.User).filter(
            models.User.role == "student",
            func.lower(models.User.level) == profile.level.lower()
        )
        if profile.department.lower() != "general":
            student_query = student_query.filter(
                func.lower(models.User.department) == profile.department.lower()
            )
        students = student_query.all()
        print(f"📚 Found {len(students)} students")

        summaries = []
        for student in students:
            try:
                counts = (
                    db.query(models.Attendance.status, func.count(models.Attendance.status))
                    .filter(models.Attendance.student_id == student.id)
                    .group_by(models.Attendance.status)
                    .all()
                )
                print(f"🔍 Attendance counts for {student.full_name}:", counts)

                summary = {
                    "student_id": student.id,
                    "full_name": student.full_name or "Unnamed"
                }
                for status, count in counts:
                    summary[status.lower()] = count

                for s in ["present", "absent", "late", "excused"]:
                    summary.setdefault(s, 0)

                summaries.append(summary)
            except Exception as e:
                print(f"❌ Error processing {student.id}: {e}")

        return summaries

    except Exception as e:
        print("❌ Top-level error:", str(e))
        raise HTTPException(status_code=500, detail="Error generating attendance summary")


@router.get("/summary/student/{student_id}")
def get_individual_attendance_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    profile = get_teacher_profile_data(db, current_user.id)

    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role == "student",
        func.lower(models.User.level) == profile.level.lower()
    )
    if profile.department.lower() != "general":
        student = student.filter(
            func.lower(models.User.department) == profile.department.lower()
        )
    student = student.first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not in your class")

    counts = (
        db.query(models.Attendance.status, func.count(models.Attendance.status))
        .filter(models.Attendance.student_id == student.id)
        .group_by(models.Attendance.status)
        .all()
    )

    summary = {"student_id": student.id, "full_name": student.full_name}
    for status, count in counts:
        summary[status.lower()] = count
    for s in ["present", "absent", "late", "excused"]:
        summary.setdefault(s, 0)

    return summary




@router.post("/mark-teacher", response_model=List[schemas.AttendanceOut])
def mark_attendance_as_teacher(
    payload: schemas.BulkAttendanceRequest,
    db: Session = Depends(get_db),
    teacher_profile: models.TeacherProfile = Depends(get_current_teacher_user)
):
    """
    Teacher marks attendance for students in their assigned class.
    Only students in the teacher's level (and department, if specified) are allowed.
    """
    try:
        print(f"\n📝 Teacher marking attendance - Level: {teacher_profile.level}, Department: {teacher_profile.department}")

        if not teacher_profile.level:
            raise HTTPException(status_code=403, detail="You are not assigned to any class.")

        for record in payload.records:
            student = db.query(models.User).filter_by(id=record.student_id).first()
            if not student:
                raise HTTPException(status_code=404, detail=f"Student {record.student_id} not found.")

            # Check level match
            if student.level != teacher_profile.level:
                raise HTTPException(
                    status_code=403,
                    detail=f"Student {student.full_name} (Level: {student.level}) is not in your assigned level ({teacher_profile.level})."
                )

            # If department is NOT 'general', check department match
            if teacher_profile.department and teacher_profile.department.lower() != "general":
                if student.department != teacher_profile.department:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Student {student.full_name} (Department: {student.department}) is not in your assigned department ({teacher_profile.department})."
                    )

        # All checks passed, mark attendance
        result = crud.bulk_mark_attendance(
            db=db,
            records=payload.records,
            date_override=payload.date_override
        )

        print(f"✅ Successfully marked attendance for {len(payload.records)} students")
        return result

    except Exception as e:
        logging.error(f"Exception in mark_attendance_as_teacher: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while marking attendance.")


@router.get("/student/{student_id}", response_model=List[schemas.AttendanceOut])
def get_attendance_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    teacher_profile: models.TeacherProfile = Depends(get_current_teacher_user)
):
    """Teacher views a student's full attendance records."""
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify student is in teacher's class
    if student.level != teacher_profile.level:
        raise HTTPException(status_code=403, detail="Student is not in your assigned class")

    return db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id
    ).order_by(models.Attendance.date.desc()).all()


@router.get("/summary-by-date/{date}")
def get_attendance_summary_by_date(
    date: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_attendance_summary_by_date(db, date)


@router.get("/summary/{student_id}")
def get_attendance_summary_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    teacher_profile: models.TeacherProfile = Depends(get_current_teacher_user)
):
    """Teacher views attendance summary for a student."""
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify student is in teacher's class
    if student.level != teacher_profile.level:
        raise HTTPException(status_code=403, detail="Student is not in your assigned class")

    records = (
        db.query(
            models.Attendance.status,
            func.count(models.Attendance.status).label("count")
        )
        .filter(models.Attendance.student_id == student_id)
        .group_by(models.Attendance.status)
        .all()
    )

    return {status: count for status, count in records}


# ========== STUDENT ROUTES ==========

@router.get("/me", response_model=List[schemas.AttendanceOut])
def get_my_attendance(
    db: Session = Depends(get_db),
    student=Depends(get_current_student_user)
):
    """Student sees their own attendance history."""
    return crud.get_student_attendance(db, student_id=student.id)






from collections import defaultdict

@router.get("/summary/daily")
def get_daily_attendance_summary(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """
    Admin: Get daily summary of attendance, grouped by date.
    """
    try:
        records = (
            db.query(
                models.Attendance.date,
                models.Attendance.status,
                func.count(models.Attendance.id)
            )
            .group_by(models.Attendance.date, models.Attendance.status)
            .order_by(models.Attendance.date.desc())
            .all()
        )

        # Build summary dictionary
        summary = defaultdict(lambda: {"present": 0, "absent": 0, "late": 0, "excused": 0})
        for att_date, status, count in records:
            if status in summary[att_date]:
                summary[att_date][status] += count
            else:
                summary[att_date][status] = count

        # Convert defaultdict to dict and format keys as ISO strings
        formatted_summary = {att_date.isoformat(): stats for att_date, stats in summary.items()}
        return formatted_summary

    except Exception as e:
        logging.error(f"Failed to get daily attendance summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get daily attendance summary")
