from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, database
from ..dependencies import get_current_teacher_user, get_current_admin_user, get_current_user, get_current_admin_or_teacher_user
from ..database import get_db
from ..models import User, TeacherProfile, TeacherSubject, Subject
from ..schemas import UserOut, ClassInfo
from ..database import get_db



router = APIRouter(prefix="/teacher", tags=["Teachers"])


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    level = current_user.level
    department = current_user.department

    teacher_profile = None
    if current_user.role == "teacher":
        teacher_profile = db.query(models.TeacherProfile).filter_by(user_id=current_user.id).first()
        if teacher_profile:
            level = teacher_profile.level
            department = teacher_profile.department

    return schemas.UserOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name,
        student_class=current_user.student_class,
        state_of_origin=current_user.state_of_origin,
        level=level,
        department=department,
        teacher_profile=teacher_profile  # ✅ include this
    )



# ---------------------- Helpers ---------------------- #

def require_teacher(user: models.User = Depends(get_current_teacher_user)):
    return user

def get_teacher_profile_data(db: Session, teacher_id: int) -> models.TeacherProfile:
    profile = db.query(models.TeacherProfile).filter_by(user_id=teacher_id).first()
    if not profile or not profile.level or not profile.department:
        raise HTTPException(status_code=403, detail="You are not assigned to any class")
    return profile


# ---------------------- Routes ---------------------- #

@router.get("/dashboard", response_model=dict)
def teacher_dashboard(current_user: models.User = Depends(require_teacher)):
    return {"message": f"Welcome, Teacher {current_user.full_name}"}


@router.get("/profile", response_model=schemas.UserOut)
def get_teacher_user_profile(current_user: models.User = Depends(require_teacher)):
    return current_user


from ..schemas import SubjectOut

@router.get("/subjects", response_model=List[SubjectOut])
def get_teacher_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher_profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    teacher_subjects = db.query(TeacherSubject).filter(TeacherSubject.teacher_id == current_user.id).all()
    subject_ids = [ts.subject_id for ts in teacher_subjects]

    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
    return subjects  # ✅ Returns full subject data as SubjectOut






@router.get("/students/my-class", response_model=List[UserOut])
def get_students_for_teacher(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("🧑‍🏫 Current user ID:", current_user.id)
    print("🧑‍🏫 Current user role:", current_user.role)

    if current_user.role != "teacher":
        print("⛔ Not a teacher!")
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher = db.query(models.TeacherProfile).filter_by(user_id=current_user.id).first()
    print("🔍 Teacher profile found:", teacher is not None)

    if not teacher or not teacher.level:
        print("⚠️ Missing teacher profile or level")
        raise HTTPException(status_code=400, detail="Teacher profile incomplete")

    print("📚 Teacher level:", repr(teacher.level))
    print("📚 Teacher department:", repr(teacher.department))

    query = db.query(models.User).filter(
        models.User.role == "student",
        func.trim(func.lower(models.User.level)) == teacher.level.strip().lower()
    )

    if teacher.department and teacher.department.lower() != "general":
        query = query.filter(
            func.trim(func.lower(models.User.department)) == teacher.department.strip().lower()
        )

    result = query.all()
    print(f"✅ Found {len(result)} students")
    return result


@router.get("/summary-by-date/{date}")
def get_summary_by_date(
    date: str,
    db: Session = Depends(get_db),
    teacher_profile: models.TeacherProfile = Depends(get_current_teacher_user)
):
    """
    Teacher views attendance summary for their class on a specific date.
    """
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    class_level = teacher_profile.level.strip().lower()
    department = teacher_profile.department.strip().lower() if teacher_profile.department else ""

    # Debug print to verify teacher filtering
    print(f"[DEBUG] Filtering attendance for level: {class_level}, department: {department}, date: {parsed_date}")

    query = (
        db.query(models.Attendance.status, func.count(models.Attendance.status))
        .join(models.User, models.Attendance.student_id == models.User.id)
        .filter(
            func.lower(models.User.level) == class_level,
            models.Attendance.date == parsed_date
        )
    )

    if department != "general":
        query = query.filter(func.lower(models.User.department) == department)

    records = query.group_by(models.Attendance.status).all()

    # Force all status types to appear
    summary = {
        "present": 0,
        "absent": 0,
        "late": 0,
        "excused": 0
    }

    for status, count in records:
        summary[status] = count

    return summary


@router.get("/attendance/summary")
def get_attendance_summary_for_class(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Confirm teacher profile
    teacher_profile = db.query(models.TeacherProfile).filter_by(user_id=current_user.id).first()
    if not teacher_profile or not teacher_profile.level:
        raise HTTPException(status_code=403, detail="You are not assigned to any class.")

    class_level = teacher_profile.level.strip().lower()
    department = teacher_profile.department.strip().lower() if teacher_profile.department else ""

    # 2. Get students in teacher's class
    students_query = db.query(models.User).filter(
        models.User.role == "student",
        func.lower(models.User.level) == class_level
    )
    if department and department != "general":
        students_query = students_query.filter(func.lower(models.User.department) == department)

    students = students_query.all()

    # 3. Fetch attendance summary for each student
    result = []
    for student in students:
        attendance_counts = (
            db.query(models.Attendance.status, func.count().label("count"))
            .filter(models.Attendance.student_id == student.id)
            .group_by(models.Attendance.status)
            .all()
        )

        status_dict = {status: count for status, count in attendance_counts}
        result.append({
            "student_id": student.id,
            "full_name": student.full_name,
            "present": status_dict.get("present", 0),
            "absent": status_dict.get("absent", 0),
            "late": status_dict.get("late", 0),
            "excused": status_dict.get("excused", 0),
        })

    return result





@router.get("/attendance/{student_id}", response_model=List[schemas.AttendanceOut])
def view_student_attendance(student_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_teacher)):
    profile = get_teacher_profile_data(db, current_user.id)
    student = db.query(models.User).filter(
        models.User.id == student_id,
        func.lower(models.User.level) == profile.level.lower(),
        models.User.role == "student"
    )
    if profile.department.lower() != "general":
        student = student.filter(func.lower(models.User.department) == profile.department.lower())
    student = student.first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found or not in your class")

    return db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        func.lower(models.Attendance.level) == profile.level.lower(),
        func.lower(models.Attendance.department) == profile.department.lower()
    ).all()


@router.get("/resources", response_model=List[schemas.ResourceOut])
def get_teacher_resources(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # ✅ This returns the actual User, not TeacherProfile
):
    print("🔐 Authenticated User ID:", current_user.id)

    # Now this matches correctly because teacher_subjects.teacher_id uses user.id
    subject_ids = db.query(models.TeacherSubject.subject_id).filter(
        models.TeacherSubject.teacher_id == current_user.id
    ).all()
    subject_ids = [sid[0] for sid in subject_ids]
    print("📘 Assigned subject IDs:", subject_ids)

    if not subject_ids:
        print("⚠️ No subjects assigned to this teacher.")
        return []

    subject_names = db.query(models.Subject.name).filter(
        models.Subject.id.in_(subject_ids)
    ).all()
    normalized_subject_names = [name[0].strip().lower() for name in subject_names]
    print("🧽 Normalized subject names:", normalized_subject_names)

    resources = db.query(models.Resource).filter(
        func.lower(func.trim(models.Resource.subject)).in_(normalized_subject_names)
    ).all()

    print("🧾 Resources found:", [r.title for r in resources])

    return resources







@router.get("/topics", response_model=List[schemas.TopicOut])
def get_teacher_topics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Access forbidden: Not a teacher")

    # Optional: Validate the teacher profile exists
    teacher_profile = (
        db.query(models.TeacherProfile)
        .filter(models.TeacherProfile.user_id == current_user.id)
        .first()
    )
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    # ✅ Corrected this line
    teacher_subjects = (
        db.query(models.TeacherSubject.subject_id)
        .filter(models.TeacherSubject.teacher_id == current_user.id)
        .subquery()
    )

    # ✅ Fetch topics
    topics = (
        db.query(models.Topic)
        .filter(models.Topic.subject_id.in_(teacher_subjects))
        .all()
    )

    return topics




@router.get("/all", response_model=List[schemas.UserOut])
def get_all_teachers(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    return db.query(models.User).filter(models.User.role == "teacher").all()


@router.post("/assign-class", response_model=dict)
def assign_class_to_teacher(data: schemas.TeacherClassAssign, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    department = data.department if data.department else "general"
    profile = db.query(models.TeacherProfile).filter_by(user_id=data.teacher_id).first()
    if profile:
        profile.level = data.level
        profile.department = department
    else:
        profile = models.TeacherProfile(user_id=data.teacher_id, level=data.level, department=department)
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return {"message": "Class assigned successfully", "profile_id": profile.id}


@router.get("/assigned-classes", response_model=List[schemas.TeacherProfileWithUser])
def get_assigned_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    return db.query(models.TeacherProfile).options(joinedload(models.TeacherProfile.user)).all()


@router.get("/timetable", response_model=List[schemas.TimetableOut])
def get_teacher_timetable(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this route.")
    teacher_subjects = db.query(models.TeacherSubject).filter_by(teacher_id=user.id).all()
    if not teacher_subjects:
        return []
    filters = [
        and_(
            models.Timetable.subject == ts.subject,
            models.Timetable.level == ts.level,
            or_(
                models.Timetable.department == ts.department,
                models.Timetable.department == None
            )
        )
        for ts in teacher_subjects
    ]
    return db.query(models.Timetable).filter(or_(*filters)).order_by(models.Timetable.day, models.Timetable.period).all()




@router.get("/students/assigned", response_model=List[schemas.UserOut])
def get_students_by_assigned_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # ✅ get_current_user returns User, not TeacherProfile
):
    print(f"🔐 Authenticated User ID: {current_user.id} ({current_user.username})")

    # ✅ Query subjects where teacher_id matches the User ID
    teacher_subjects = db.query(models.TeacherSubject).join(models.Subject).filter(
        models.TeacherSubject.teacher_id == current_user.id
    ).all()

    if not teacher_subjects:
        print("⚠️ No subjects assigned to this teacher.")
        return []

    print("📘 Assigned subjects:", [
        (ts.subject.name, ts.subject.level, ts.subject.department) for ts in teacher_subjects
    ])

    # Generate (level, department) combinations
    combinations = set(
        (ts.subject.level.lower(), (ts.subject.department or "").lower())
        for ts in teacher_subjects
    )

    print("🔍 Matching (level, dept) combinations:", combinations)

    # Build OR filter conditions
    or_conditions = []
    for level, dept in combinations:
        base_condition = func.lower(models.User.level) == level
        if dept and dept != "general":
            condition = and_(base_condition, func.lower(models.User.department) == dept)
        else:
            condition = base_condition
        or_conditions.append(condition)

    if not or_conditions:
        print("⚠️ No valid level/department combinations found.")
        return []

    students = db.query(models.User).filter(
        models.User.role == "student",
        or_(*or_conditions)
    ).all()

    print(f"🎓 Matched {len(students)} students")
    return students




@router.get("/subjects-with-students-progress", response_model=List[schemas.TeacherSubjectWithProgress])
def get_subjects_with_students_and_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"🔐 Authenticated User ID: {current_user.id} ({current_user.username})")

    teacher_subjects = db.query(models.TeacherSubject)\
        .options(joinedload(models.TeacherSubject.subject))\
        .filter(models.TeacherSubject.teacher_id == current_user.id)\
        .all()

    if not teacher_subjects:
        print("⚠️ No subjects assigned.")
        return []

    results = []

    for ts in teacher_subjects:
        subject = ts.subject
        if not subject:
            continue

        subject_level = (subject.level or "").lower()
        subject_department = (subject.department or "").lower()

        print(f"📘 Processing subject: {subject.name} (Level: {subject_level}, Dept: {subject_department})")

        # Query students matching level and optionally department
        students_query = db.query(models.User).filter(
            models.User.role == "student",
            func.lower(models.User.level) == subject_level
        )

        if subject_department and subject_department != "general":
            students_query = students_query.filter(
                func.lower(models.User.department) == subject_department
            )

        students = students_query.all()

        print(f"🎓 Found {len(students)} students for subject '{subject.name}'")

        student_progress_list = []

        for student in students:
            topic_progress = db.query(
                models.Topic.title.label("topic_title"),
                func.sum(models.ProgressTracking.score).label("total_score"),
                func.sum(models.ProgressTracking.total_questions).label("total_questions")
            ).join(
                models.Topic, models.ProgressTracking.topic_id == models.Topic.id
            ).filter(
                models.ProgressTracking.user_id == student.id,
                models.Topic.subject_id == subject.id  # ✅ Match by FK, not name
            ).group_by(
                models.Topic.title
            ).all()

            student_progress_list.append({
                "user_id": student.id,
                "full_name": student.full_name,
                "username": student.username,
                "topics": [
                    {
                        "topic_title": tp.topic_title,
                        "total_score": float(tp.total_score or 0),
                        "total_questions": int(tp.total_questions or 0)
                    }
                    for tp in topic_progress
                ]
            })

        results.append({
            "subject_name": subject.name,
            "level": subject.level,
            "department": subject.department,
            "students": student_progress_list
        })

    print(f"✅ Returning {len(results)} subjects with student progress")
    return results



@router.get("/report-cards", response_model=List[schemas.ReportCardOut])
def get_report_cards_for_teacher_subjects(
    student_id: int = Query(...),  # ← change this line
    term: str = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"✅ Authenticated user: {current_user.id} | {current_user.username} | Role: {current_user.role}")

    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Access denied: Only teachers can view report cards.")

    # Get subject IDs assigned to this teacher
    subject_ids = db.query(models.TeacherSubject.subject_id).filter(
        models.TeacherSubject.teacher_id == current_user.id
    ).all()
    subject_ids = [sid[0] for sid in subject_ids]

    if not subject_ids:
        print("⚠️ No subjects assigned to this teacher.")
        return []

    # Normalize subject names
    subject_names = db.query(models.Subject.name).filter(
        models.Subject.id.in_(subject_ids)
    ).all()
    normalized_subject_names = [name[0].strip().lower() for name in subject_names]
    print("📘 Normalized subject names:", normalized_subject_names)

    # Fetch report cards for this student ID, matching teacher’s subjects
    report_cards = db.query(models.ReportCard).filter(
        models.ReportCard.student_id == student_id,
        func.lower(func.trim(models.ReportCard.subject)).in_(normalized_subject_names),
        func.lower(models.ReportCard.term) == term.lower(),
        models.ReportCard.year == year
    ).all()

    print(f"📄 Found {len(report_cards)} report cards.")
    return report_cards



@router.patch("/report-cards/{report_card_id}", response_model=schemas.ReportCardOut)
def update_teacher_report_card_comment(
    report_card_id: int,
    update_data: schemas.ReportCardUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    report_card = db.query(models.ReportCard).filter_by(id=report_card_id).first()

    if not report_card:
        raise HTTPException(status_code=404, detail="Report card not found")

    # Optional: allow admin to bypass teacher check
    if current_user.role == 'admin':
        if update_data.comment is not None:
            report_card.comment = update_data.comment
            db.commit()
            db.refresh(report_card)
        return report_card

    # If not admin, enforce subject match for teacher
    if current_user.role == 'teacher':
        teacher_subjects = (
            db.query(models.TeacherSubject)
            .join(models.Subject)
            .filter(models.TeacherSubject.teacher_id == current_user.id)
            .all()
        )
        subject_names = [ts.subject.name.lower() for ts in teacher_subjects]

        if report_card.subject.lower() not in subject_names:
            raise HTTPException(status_code=403, detail="You are not authorized to edit this report card")

        if update_data.comment is not None:
            report_card.comment = update_data.comment
            db.commit()
            db.refresh(report_card)
        return report_card

    raise HTTPException(status_code=403, detail="Only teachers or admins can update report cards")


@router.get("/report-cards/by-class-preview", response_model=List[schemas.ReportPreviewOut])
def get_report_card_previews_for_class(
    term: str,
    year: int,
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    profile: TeacherProfile = Depends(get_current_teacher_user)
):
    from collections import defaultdict

    term_mapping = {"first": "term_1", "second": "term_2", "third": "term_3"}
    normalized_term = term_mapping.get(term.lower(), term.lower())

    # ✅ Skip re-fetching the profile
    if not profile or not profile.level:
        raise HTTPException(status_code=403, detail="You are not assigned to any class")

    students_query = (
        db.query(models.User, models.StudentProfile)
        .join(models.StudentProfile, models.StudentProfile.user_id == models.User.id)
        .filter(
            func.lower(models.User.level) == profile.level.lower(),
            models.User.role == "student"
        )
    )

    # ✅ Apply department filtering only if not "general"
    if profile.department.lower() != "general":
        students_query = students_query.filter(
            func.lower(models.User.department) == profile.department.lower()
        )

    if student_id:
        students_query = students_query.filter(models.User.id == student_id)

    students = students_query.all()

    if not students:
        raise HTTPException(status_code=404, detail="No students found for your class")

    student_ids = [user.id for user, _ in students]

    # 🧾 Fetch report cards
    report_cards = db.query(models.ReportCard).filter(
        models.ReportCard.student_id.in_(student_ids),
        func.lower(models.ReportCard.term) == normalized_term,
        models.ReportCard.year == year
    ).all()

    result = defaultdict(lambda: {"subjects": []})

    for user, profile in students:
        student_info = schemas.ReportStudentInfo(
            full_name=user.full_name,
            guardian_name=profile.guardian_name,
            contact_number=profile.contact_number,
            address=profile.address,
            profile_image=profile.profile_image,
            date_of_birth=profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            state_of_origin=profile.state_of_origin,
            gender=profile.gender,
        )
        result[user.id].update({
            "student": student_info,
            "term": term.title(),
            "year": year,
            "level": user.level
        })

    for rc in report_cards:
        total = sum(filter(None, [rc.first_test_score or 0.0, rc.second_test_score or 0.0, rc.exam_score or 0.0]))
        result[rc.student_id]["subjects"].append({
            "subject": rc.subject,
            "first_test_score": rc.first_test_score or 0.0,
            "second_test_score": rc.second_test_score or 0.0,
            "exam_score": rc.exam_score or 0.0,
            "total": total,
            "comment": rc.comment
        })

    for sid in result:
        attendance = db.query(models.Attendance).filter_by(student_id=sid).all()
        result[sid]["attendance"] = {
            "total_days": len(attendance),
            "present": sum(1 for a in attendance if a.status == "present"),
            "absent": sum(1 for a in attendance if a.status == "absent"),
            "late": sum(1 for a in attendance if a.status == "late"),
            "excused": sum(1 for a in attendance if a.status == "excused"),
        }

    return list(result.values())




@router.get("/subjects-by-level", response_model=List[schemas.SubjectOut])
def get_my_subjects_by_level(
    level: str,
    db: Session = Depends(get_db),
    current_teacher: models.TeacherProfile = Depends(get_current_teacher_user)
):
    subjects = (
        db.query(models.Subject)
        .join(models.TeacherSubject, models.TeacherSubject.subject_id == models.Subject.id)
        .filter(
            models.TeacherSubject.teacher_id == current_teacher.user_id,  # ✅ Fix here
            func.lower(models.Subject.level) == level.lower()
        )
        .distinct()
        .all()
    )
    return subjects

@router.get("/students", response_model=List[UserOut])
def get_students(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "student").all()




@router.get("/get-classes", response_model=List[ClassInfo])
def get_classes_for_teacher(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this")

    records = db.query(
        func.lower(func.trim(User.level)).label("level"),
        func.coalesce(func.lower(func.trim(User.department)), "").label("department")
    ).filter(
        func.lower(User.role) == "student"
    ).distinct().all()

    return [
        ClassInfo(level=r.level.strip(), department=r.department.strip() if r.department else "")
        for r in records
    ]


    
@router.get("/get-students-by-class")
def get_students_by_class(
    level: str,
    department: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_teacher_user),  # ⬅ allow admin/teacher
):
    students = (
        db.query(User)
        .filter(
            func.lower(User.role) == "student",
            func.lower(User.level) == level.lower(),
            func.lower(User.department) == department.lower()
        )
        .all()
    )
    return students
