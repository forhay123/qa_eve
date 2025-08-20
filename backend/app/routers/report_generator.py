from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List
import calendar

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user


from fastapi import Query
from sqlalchemy import or_, and_
from ..dependencies import require_teacher, get_current_admin_user  # assuming this exists for teacher auth

router = APIRouter(prefix="/report-cards", tags=["Report Cards"])



# 🎯 Preview report: Test + Exam + Attendance
def preview_report_card(student_id: int, term: str, year: int, db: Session):
    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    level = user.level
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == student_id).first()

    # ✅ Attendance
    today = date.today()
    start = date(today.year, today.month, 1)
    _, end_day = calendar.monthrange(today.year, today.month)
    end = date(today.year, today.month, end_day)

    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.date >= start,
        models.Attendance.date <= end
    ).all()

    attendance_summary = {
        "total_days": len(attendance_records),
        "present": sum(1 for a in attendance_records if a.status == "present"),
        "absent": sum(1 for a in attendance_records if a.status == "absent"),
        "late": sum(1 for a in attendance_records if a.status == "late"),
        "excused": sum(1 for a in attendance_records if a.status == "excused"),
    }

    # ✅ Test and Exam Results
    test_results = db.query(models.TestResult).filter(
        models.TestResult.user_id == student_id,
        models.TestResult.level == level,
        models.TestResult.test_type.in_(['first', 'second'])
    ).all()

    exam_results = db.query(models.ExamResult).filter(
        models.ExamResult.user_id == student_id,
        models.ExamResult.level == level
    ).all()

    # ✅ Group by subject
    subjects = {}
    for t in test_results:
        key = t.subject.lower()
        if key not in subjects:
            subjects[key] = {
                "subject": t.subject,
                "first_test_score": None,
                "first_test_total_questions": None,
                "first_test_percentage": None,
                "second_test_score": None,
                "second_test_total_questions": None,
                "second_test_percentage": None,
                "exam_score": None,
                "exam_total_questions": None,
                "exam_percentage": None,
            }

        if t.test_type == "first":
            subjects[key]["first_test_score"] = t.total_score
            subjects[key]["first_test_total_questions"] = t.total_questions
            subjects[key]["first_test_percentage"] = float(t.percentage)
        elif t.test_type == "second":
            subjects[key]["second_test_score"] = t.total_score
            subjects[key]["second_test_total_questions"] = t.total_questions
            subjects[key]["second_test_percentage"] = float(t.percentage)

    for e in exam_results:
        key = e.subject.lower()
        if key not in subjects:
            subjects[key] = {
                "subject": e.subject,
                "first_test_score": None,
                "first_test_total_questions": None,
                "first_test_percentage": None,
                "second_test_score": None,
                "second_test_total_questions": None,
                "second_test_percentage": None,
                "exam_score": None,
                "exam_total_questions": None,
                "exam_percentage": None,
            }

        subjects[key]["exam_score"] = e.total_score
        subjects[key]["exam_total_questions"] = e.total_questions
        subjects[key]["exam_percentage"] = float(e.percentage)

    valid_terms = ["term_1", "term_2", "term_3"]

    # ✅ Optional Comments
    term_map = {
        "First": "term_1",
        "Second": "term_2",
        "Third": "term_3"
    }

    if term in valid_terms:
        db_term = term
    else:
        db_term = term_map.get(term)
        
    if not db_term:
        raise HTTPException(status_code=400, detail="Invalid term")

    comment_map = {
        c.subject.lower(): c.comment
        for c in db.query(models.ReportCard).filter_by(
            student_id=student_id,
            term=db_term,
            year=year
        ).all()
    }

    subject_scores = []
    for subj_key, subj in subjects.items():
        total = sum([
            subj.get("first_test_score") or 0,
            subj.get("second_test_score") or 0,
            subj.get("exam_score") or 0
        ])
        subject_scores.append({
            **subj,
            "total": total,
            "comment": comment_map.get(subj_key)
        })

    return {
        "student": {
            "full_name": user.full_name,
            "guardian_name": profile.guardian_name if profile else None,
            "contact_number": profile.contact_number if profile else None,
            "address": profile.address if profile else None,
            "profile_image": profile.profile_image if profile else None,
            "date_of_birth": profile.date_of_birth.isoformat() if profile and profile.date_of_birth else None,
            "state_of_origin": profile.state_of_origin if profile else None,
            "gender": profile.gender if profile else None,
        },
        "term": term,
        "year": year,
        "level": level,
        "attendance": attendance_summary,
        "subjects": subject_scores
    }


@router.post("/", response_model=schemas.ReportCardOut)
def upsert_report_card(entry: schemas.ReportCardCreate, db: Session = Depends(get_db)):
    existing = db.query(models.ReportCard).filter_by(
        student_id=entry.student_id,
        subject=entry.subject,
        term=entry.term,
        year=entry.year
    ).first()

    if existing:
        existing.comment = entry.comment
        db.commit()
        db.refresh(existing)
        return existing

    new_entry = models.ReportCard(**entry.dict())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.put("/{report_id}", response_model=schemas.ReportCardOut)
def update_report_card_comment(report_id: int, update: schemas.ReportCardUpdate, db: Session = Depends(get_db)):
    report = db.query(models.ReportCard).filter_by(id=report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report card entry not found")
    report.comment = update.comment
    db.commit()
    db.refresh(report)
    return report


@router.get("/me", response_model=List[schemas.ReportCardOut])
def get_my_report_cards(term: str, year: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ReportCard).filter(
        models.ReportCard.student_id == current_user.id,
        models.ReportCard.term == term,
        models.ReportCard.year == year
    ).all()


@router.get("/{student_id}/{term}/{year}", response_model=List[schemas.ReportCardOut])
def get_report_card_by_student(student_id: int, term: str, year: int, db: Session = Depends(get_db)):
    return db.query(models.ReportCard).filter_by(
        student_id=student_id,
        term=term,
        year=year
    ).all()


@router.get("/search/", response_model=List[schemas.ReportCardOut])
def search_report_cards(student_id: int, term: str, year: int, db: Session = Depends(get_db)):
    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.is_admin == False
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    reports = db.query(models.ReportCard).filter_by(
        student_id=student.id,
        term=term,
        year=year
    ).all()

    return reports



@router.post("/generate/")
def generate_and_save_report_cards(level: str, term: str, year: int, db: Session = Depends(get_db)):
    students = db.query(models.User).filter(
        models.User.level == level,
        models.User.is_admin == False
    ).all()

    created_count = 0
    for student in students:
        test_results = db.query(models.TestResult).filter(
            models.TestResult.user_id == student.id,
            models.TestResult.level == level,
            models.TestResult.test_type.in_(['first', 'second'])
        ).all()

        exam_results = db.query(models.ExamResult).filter(
            models.ExamResult.user_id == student.id,
            models.ExamResult.level == level
        ).all()

        subjects = {}
        for t in test_results:
            subj = t.subject.lower()
            subjects.setdefault(subj, {
                "subject": t.subject,
                "first_test_score": 0,
                "second_test_score": 0,
                "exam_score": 0
            })
            if t.test_type == "first":
                subjects[subj]["first_test_score"] += t.total_score
            elif t.test_type == "second":
                subjects[subj]["second_test_score"] += t.total_score

        for e in exam_results:
            subj = e.subject.lower()
            subjects.setdefault(subj, {
                "subject": e.subject,
                "first_test_score": 0,
                "second_test_score": 0,
                "exam_score": 0
            })
            subjects[subj]["exam_score"] += e.total_score

        for subj_data in subjects.values():
            exists = db.query(models.ReportCard).filter_by(
                student_id=student.id,
                subject=subj_data["subject"],
                term=term,
                year=year
            ).first()
            if not exists:
                db.add(models.ReportCard(
                    student_id=student.id,
                    term=term,
                    year=year,
                    subject=subj_data["subject"],
                    first_test_score=subj_data["first_test_score"],
                    second_test_score=subj_data["second_test_score"],
                    exam_score=subj_data["exam_score"],
                    comment=None
                ))
                created_count += 1

    db.commit()
    return {"message": f"{created_count} report card entries created for {term} {year}"}


@router.post("/generate-student/")
def generate_report_for_student(payload: schemas.GenerateStudentReportIn, db: Session = Depends(get_db)):
    student_id = payload.student_id
    term = payload.term
    year = payload.year

    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    level = user.level

    test_results = db.query(models.TestResult).filter(
        models.TestResult.user_id == student_id,
        models.TestResult.level == level,
        models.TestResult.test_type.in_(['first', 'second'])
    ).all()

    exam_results = db.query(models.ExamResult).filter(
        models.ExamResult.user_id == student_id,
        models.ExamResult.level == level
    ).all()

    subjects = {}
    for t in test_results:
        subj = t.subject.lower()
        subjects.setdefault(subj, {
            "subject": t.subject,
            "first_test_score": 0,
            "second_test_score": 0,
            "exam_score": 0
        })
        if t.test_type == "first":
            subjects[subj]["first_test_score"] += t.total_score
        elif t.test_type == "second":
            subjects[subj]["second_test_score"] += t.total_score

    for e in exam_results:
        subj = e.subject.lower()
        subjects.setdefault(subj, {
            "subject": e.subject,
            "first_test_score": 0,
            "second_test_score": 0,
            "exam_score": 0
        })
        subjects[subj]["exam_score"] += e.total_score

    created_count = 0
    for subj_data in subjects.values():
        exists = db.query(models.ReportCard).filter_by(
            student_id=student_id,
            subject=subj_data["subject"],
            term=term,
            year=year
        ).first()
        if not exists:
            db.add(models.ReportCard(
                student_id=student_id,
                term=term,
                year=year,
                subject=subj_data["subject"],
                first_test_score=subj_data["first_test_score"],
                second_test_score=subj_data["second_test_score"],
                exam_score=subj_data["exam_score"],
                comment=None
            ))
            created_count += 1

    db.commit()
    return {"message": f"{created_count} report card entries created for {user.full_name}"}


@router.get("/search/preview", response_model=schemas.ReportPreviewOut)
def preview_report_card_by_name(level: str, name: str, term: str, year: int, db: Session = Depends(get_db)):
    name_clean = ' '.join(name.strip().split())
    student = db.query(models.User).filter(
        models.User.level == level,
        models.User.full_name.ilike(f"%{name_clean}%"),
        models.User.is_admin == False
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return preview_report_card(student_id=student.id, term=term, year=year, db=db)


@router.get("/preview/me", response_model=schemas.ReportPreviewOut)
def preview_my_report(term: str, year: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return preview_report_card(current_user.id, term, year, db)


@router.get("/", response_model=List[schemas.ReportCardOut])
def get_all_report_cards(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Optional: check if current_user.is_admin or has permissions
    return db.query(models.ReportCard).all()


from sqlalchemy import func

@router.get("/unique-students/count")
def get_unique_report_card_students_count(db: Session = Depends(get_db)):
    count = db.query(func.count(func.distinct(models.ReportCard.student_id))).scalar()
    return {"unique_student_report_cards": count or 0}






@router.get("/by-class-preview", response_model=schemas.ReportPreviewOut)
def teacher_preview_student_report(
    student_name: str = Query(..., description="Student full name"),
    term: str = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    # 🔍 Normalize input
    name_clean = ' '.join(student_name.strip().split()).lower()

    # 📚 Fetch assigned subject combinations
    teacher_subjects = db.query(models.TeacherSubject).join(models.Subject).filter(
        models.TeacherSubject.teacher_id == current_user.id
    ).all()

    combinations = set(
        (ts.subject.level.lower(), (ts.subject.department or "").lower())
        for ts in teacher_subjects
    )

    if not combinations:
        raise HTTPException(status_code=403, detail="You are not assigned to any class")

    # 🧠 Match student by level/department
    or_conditions = []
    for level, dept in combinations:
        base = func.lower(models.User.level) == level
        if dept and dept != "general":
            or_conditions.append(and_(base, func.lower(models.User.department) == dept))
        else:
            or_conditions.append(base)

    student = db.query(models.User).filter(
        models.User.role == "student",
        or_(*or_conditions),
        func.lower(models.User.full_name).ilike(f"%{name_clean}%")
    ).first()

    if not student:
        raise HTTPException(status_code=403, detail="Student not found or not in your assigned class")

    try:
        return preview_report_card(student_id=student.id, term=term, year=year, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")



@router.get("/preview", response_model=schemas.ReportPreviewOut)
def admin_preview_report_card(
    student_id: int = Query(...),
    term: str = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    _: any = Depends(get_current_admin_user),
):
    try:
        return preview_report_card(student_id, term, year, db)
    except Exception as e:
        print("❌ ERROR in preview_report_card:", e)
        raise HTTPException(status_code=500, detail=str(e))
