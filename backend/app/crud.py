from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, or_
from datetime import date, datetime
from typing import List, Optional
from .models import Assignment, AssignmentSubmission, User, Subject

from . import models, schemas
from .schemas import QuestionUpdate, AssignmentAdminOut
from .services.grading import grade_theory_answer

# -------------------- PDF & Question Logic --------------------

def determine_question_type(option_a, option_b, option_c, option_d) -> str:
    options = [option_a, option_b, option_c, option_d]
    has_options = any(opt and opt.strip() for opt in options)
    return "objective" if has_options else "theory"

def create_pdf(db: Session, pdf: schemas.PDFDocumentCreate) -> models.PDFDocument:
    db_pdf = models.PDFDocument(**pdf.dict())
    try:
        db.add(db_pdf)
        db.commit()
        db.refresh(db_pdf)
        return db_pdf
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to save PDF: {e}")

def create_question(db: Session, question: schemas.QuestionCreate) -> models.Question:
    data = question.dict()
    data["question_type"] = determine_question_type(data.get("option_a"), data.get("option_b"), data.get("option_c"), data.get("option_d"))
    db_q = models.Question(**data)
    try:
        db.add(db_q)
        db.commit()
        db.refresh(db_q)
        return db_q
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to save question: {e}")

def update_question(db: Session, question_id: int, updates: QuestionUpdate) -> models.Question:
    db_q = db.query(models.Question).filter_by(id=question_id).first()
    if not db_q:
        raise ValueError("Question not found")

    for field, value in updates.dict(exclude_unset=True).items():
        setattr(db_q, field, value)

    db_q.question_type = determine_question_type(db_q.option_a, db_q.option_b, db_q.option_c, db_q.option_d)

    try:
        db.commit()
        db.refresh(db_q)
        return db_q
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to update question: {e}")

# -------------------- User Answer Logic --------------------

def save_user_answer(db: Session, answer: schemas.UserAnswerCreate, is_correct: bool, correction: Optional[str]) -> models.UserAnswer:
    db_answer = models.UserAnswer(
        user_id=answer.user_id,
        question_id=answer.question_id,
        answer=answer.answer,
        is_correct=is_correct,
        correction=correction if not is_correct else None
    )
    try:
        db.add(db_answer)
        db.commit()
        db.refresh(db_answer)
        return db_answer
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to save user answer: {e}")

# -------------------- Topic Logic --------------------

def get_topics_by_subject(level: str, subject: str, db: Session) -> List[models.Topic]:
    return db.query(models.Topic)\
        .filter(func.lower(models.Topic.level) == level.lower())\
        .filter(func.lower(models.Topic.subject) == subject.lower())\
        .all()

# -------------------- Student Profile Logic --------------------

def get_all_student_profiles(db: Session) -> List[models.StudentProfile]:
    return db.query(models.StudentProfile).options(joinedload(models.StudentProfile.user)).all()

def get_student_profile_by_user_id(db: Session, user_id: int) -> Optional[models.StudentProfile]:
    return db.query(models.StudentProfile).filter_by(user_id=user_id).first()

def create_student_profile(db: Session, profile: schemas.StudentProfileCreate) -> models.StudentProfile:
    db_profile = models.StudentProfile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_student_profile(db: Session, db_profile: models.StudentProfile, updates: schemas.StudentProfileUpdate) -> models.StudentProfile:
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(db_profile, field, value)
    try:
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to update profile: {e}")

# -------------------- Attendance Logic --------------------

def mark_attendance(db: Session, student_id: int, status: str, day: date = date.today()) -> models.Attendance:
    record = db.query(models.Attendance).filter_by(student_id=student_id, date=day).first()
    if record:
        record.status = status
    else:
        record = models.Attendance(student_id=student_id, status=status, date=day)
        db.add(record)
    db.commit()
    db.refresh(record)
    return record

def bulk_mark_attendance(db: Session, records: List[schemas.BulkAttendanceRecord], date_override: Optional[date] = None) -> List[models.Attendance]:
    attendance_date = date_override or date.today()
    results = []
    try:
        for rec in records:
            if not rec.student_id or not rec.status:
                continue
            record = db.query(models.Attendance).filter_by(student_id=rec.student_id, date=attendance_date).first()
            if record:
                record.status = rec.status
            else:
                record = models.Attendance(student_id=rec.student_id, status=rec.status, date=attendance_date)
                db.add(record)
            results.append(record)
        db.commit()
        for rec in results:
            db.refresh(rec)
        return results
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Error during bulk attendance update: {e}")

def get_all_attendance(db: Session, date_filter: Optional[date] = None) -> List[models.Attendance]:
    query = db.query(models.Attendance).join(models.User)
    if date_filter:
        query = query.filter(models.Attendance.date == date_filter)
    return query.all()

def get_student_attendance(db: Session, student_id: int) -> List[models.Attendance]:
    return db.query(models.Attendance).filter_by(student_id=student_id).order_by(models.Attendance.date.desc()).all()


def get_attendance_summary_by_date(db: Session, date: str):
    from sqlalchemy import func
    from .models import Attendance

    return {
        "present": db.query(Attendance).filter(Attendance.date == date, Attendance.status == "present").count(),
        "absent": db.query(Attendance).filter(Attendance.date == date, Attendance.status == "absent").count(),
        "late": db.query(Attendance).filter(Attendance.date == date, Attendance.status == "late").count(),
        "excused": db.query(Attendance).filter(Attendance.date == date, Attendance.status == "excused").count(),
    }



# -------------------- Report Card Logic --------------------

def create_report_card(db: Session, report: schemas.ReportCardCreate) -> models.ReportCard:
    db_report = models.ReportCard(**report.dict())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def bulk_create_report_cards(db: Session, reports: List[schemas.ReportCardCreate]) -> List[models.ReportCard]:
    db_reports = [models.ReportCard(**r.dict()) for r in reports]
    db.add_all(db_reports)
    db.commit()
    return db_reports

def get_report_cards_for_student(db: Session, student_id: int, term: Optional[str] = None, year: Optional[int] = None) -> List[models.ReportCard]:
    query = db.query(models.ReportCard).filter(models.ReportCard.student_id == student_id)
    if term:
        query = query.filter(models.ReportCard.term == term)
    if year:
        query = query.filter(models.ReportCard.year == year)
    return query.all()

def get_single_report_card(db: Session, student_id: int, subject: str, term: str, year: int) -> Optional[models.ReportCard]:
    return db.query(models.ReportCard).filter_by(student_id=student_id, subject=subject, term=term, year=year).first()

def update_report_card(db: Session, report_id: int, updates: schemas.ReportCardCreate) -> models.ReportCard:
    report = db.query(models.ReportCard).filter_by(id=report_id).first()
    if not report:
        raise ValueError("Report not found")
    for field, value in updates.dict().items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return report

def delete_report_card(db: Session, report_id: int) -> bool:
    report = db.query(models.ReportCard).filter_by(id=report_id).first()
    if report:
        db.delete(report)
        db.commit()
        return True
    return False

# -------------------- Subject Logic --------------------

def get_subjects_for_student(db: Session, level: str, department: str) -> List[models.Subject]:
    query = db.query(models.Subject).filter(func.lower(models.Subject.level) == level.lower())
    if level.lower().startswith("ss"):
        query = query.filter(or_(
            func.lower(models.Subject.department) == department.lower(),
            models.Subject.department == None,
            func.length(func.trim(models.Subject.department)) == 0
        ))
    return query.order_by(models.Subject.name.asc()).all()

# -------------------- Assignment Logic --------------------

def create_assignment(db: Session, assignment: schemas.AssignmentCreate, teacher_id: int) -> models.Assignment:
    db_assignment = models.Assignment(**assignment.dict(exclude={"theory_questions", "objective_questions"}), teacher_id=teacher_id)
    try:
        db.add(db_assignment)
        db.flush()

        for tq in assignment.theory_questions:
            db.add(models.AssignmentTheoryQuestion(assignment_id=db_assignment.id, **tq.dict()))
        for oq in assignment.objective_questions:
            db.add(models.AssignmentObjectiveQuestion(assignment_id=db_assignment.id, **oq.dict()))

        db.commit()
        db.refresh(db_assignment)
        return db_assignment
    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to create assignment: {e}")

def get_assignments_for_teacher(db: Session, teacher_id: int):
    return db.query(models.Assignment).filter_by(teacher_id=teacher_id).order_by(models.Assignment.due_date.desc()).all()



def get_assignments_for_class(
    db: Session,
    class_level: str,
    subject_id: int,
    topic: Optional[str] = None,
    student_id: Optional[int] = None
):
    query = db.query(models.Assignment)\
        .options(
            joinedload(models.Assignment.subject),
            joinedload(models.Assignment.teacher),
            joinedload(models.Assignment.objective_questions),
            joinedload(models.Assignment.theory_questions),
            joinedload(models.Assignment.submissions),
        )\
        .filter(
            models.Assignment.class_level.ilike(class_level),
            models.Assignment.subject_id == subject_id
        )

    if topic:
        query = query.filter(models.Assignment.description.ilike(f"%{topic}%"))

    assignments = query.order_by(models.Assignment.due_date.desc()).all()

    # ✅ Inject status into each assignment
    result = []
    for assignment in assignments:
        assignment_out = schemas.AssignmentOut.from_orm(assignment)
        
        if student_id:
            assignment_out.status = determine_assignment_status(assignment, student_id)
        else:
            assignment_out.status = None  # If no student_id, skip status

        result.append(assignment_out)

    return result



def get_assignment_by_id(db: Session, assignment_id: int) -> Optional[models.Assignment]:
    return db.query(models.Assignment)\
        .options(joinedload(models.Assignment.theory_questions), joinedload(models.Assignment.objective_questions))\
        .filter_by(id=assignment_id).first()

def update_assignment(db: Session, assignment_id: int, updates: schemas.AssignmentUpdate) -> models.Assignment:
    assignment = db.query(models.Assignment).filter_by(id=assignment_id).first()
    if not assignment:
        raise ValueError("Assignment not found")
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)
    return assignment

def delete_assignment(db: Session, assignment_id: int) -> bool:
    assignment = db.query(models.Assignment).filter_by(id=assignment_id).first()
    if assignment:
        db.delete(assignment)
        db.commit()
        return True
    return False

# -------------------- Assignment Submission Logic --------------------

def submit_assignment(db: Session, submission: schemas.AssignmentSubmissionCreate) -> models.AssignmentSubmission:
    existing = db.query(models.AssignmentSubmission).filter_by(
        assignment_id=submission.assignment_id,
        student_id=submission.student_id
    ).first()
    if existing:
        raise ValueError("You have already submitted this assignment.")

    db_submission = models.AssignmentSubmission(
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        file_url=submission.file_url,
        submitted_at=datetime.utcnow(),
        status="submitted"  # ✅ Set status to submitted
    )

    try:
        db.add(db_submission)
        db.flush()  # To get db_submission.id

        correct_answers = 0
        total_questions = 0

        # ✅ Process theory answers
        for ta in submission.theory_answers:
            q = db.query(models.AssignmentTheoryQuestion).filter_by(
                id=ta.question_id,
                assignment_id=submission.assignment_id
            ).first()
            if not q:
                print(f"❌ Invalid theory question ID {ta.question_id} for assignment {submission.assignment_id}")
                continue

            score = grade_theory_answer(q.model_answer, ta.student_answer)
            is_correct = score >= 1.0  # Adjust threshold if needed

            if is_correct:
                correct_answers += 1
            total_questions += 1

            db.add(models.AssignmentTheoryAnswer(
                submission_id=db_submission.id,
                question_id=ta.question_id,
                student_answer=ta.student_answer,
                score=score
            ))

        # ✅ Process objective answers
        for oa in submission.objective_answers:
            q = db.query(models.AssignmentObjectiveQuestion).filter_by(
                id=oa.question_id,
                assignment_id=submission.assignment_id
            ).first()
            if not q:
                print(f"❌ Invalid objective question ID {oa.question_id} for assignment {submission.assignment_id}")
                continue

            is_correct = oa.selected_option == q.correct_option
            if is_correct:
                correct_answers += 1
            total_questions += 1

            db.add(models.AssignmentObjectiveAnswer(
                submission_id=db_submission.id,
                question_id=oa.question_id,
                selected_option=oa.selected_option,
                is_correct=is_correct
            ))

        # ✅ Save score directly
        db_submission.score = round(correct_answers, 2)

        # ✅ Automatically set status to completed if graded immediately
        db_submission.status = "completed"

        db.commit()
        db.refresh(db_submission)
        return db_submission

    except SQLAlchemyError as e:
        db.rollback()
        raise RuntimeError(f"❌ Failed to submit and grade assignment: {e}")


def get_submissions_for_assignment(db: Session, assignment_id: int) -> List[models.AssignmentSubmission]:
    submissions = (
        db.query(models.AssignmentSubmission)
        .filter_by(assignment_id=assignment_id)
        .options(
            selectinload(models.AssignmentSubmission.student),
            selectinload(models.AssignmentSubmission.objective_answers),
            selectinload(models.AssignmentSubmission.theory_answers),
        )
        .all()
    )

    # Get total number of questions for this assignment
    total_objective = db.query(models.AssignmentObjectiveQuestion).filter_by(assignment_id=assignment_id).count()
    total_theory = db.query(models.AssignmentTheoryQuestion).filter_by(assignment_id=assignment_id).count()
    total_questions = total_objective + total_theory

    for submission in submissions:
        objective_correct = sum(1 for ans in submission.objective_answers if ans.is_correct)
        theory_correct = sum(1 for ans in submission.theory_answers if ans.score and ans.score >= 1.0)
        submission.score = objective_correct + theory_correct  # ✅ Overwrite with fresh correct count
        # You could optionally attach total_questions here as a custom field

    return submissions


def get_submission_by_student_and_assignment(db: Session, student_id: int, assignment_id: int) -> Optional[models.AssignmentSubmission]:
    return db.query(models.AssignmentSubmission).filter_by(student_id=student_id, assignment_id=assignment_id).first()

def get_submissions_for_student(db: Session, student_id: int) -> List[models.AssignmentSubmission]:
    return (
        db.query(models.AssignmentSubmission)
        .filter_by(student_id=student_id)
        .options(
            joinedload(models.AssignmentSubmission.assignment).joinedload(models.Assignment.subject),

            joinedload(models.AssignmentSubmission.objective_answers).joinedload(
                models.AssignmentObjectiveAnswer.question
            ),

            joinedload(models.AssignmentSubmission.theory_answers).joinedload(
                models.AssignmentTheoryAnswer.question
            ),
        )
        .order_by(models.AssignmentSubmission.submitted_at.desc())
        .all()
    )


# -------------------- Grading Logic --------------------

def grade_submission(db: Session, grade_data: schemas.GradedAssignmentCreate) -> models.AssignmentSubmission:
    submission = db.query(models.AssignmentSubmission).filter_by(id=grade_data.submission_id).first()
    if not submission:
        raise ValueError("Submission not found")

    assignment = submission.assignment  # via relationship
    total_questions = len(assignment.theory_questions or []) + len(assignment.objective_questions or [])

    if grade_data.score > total_questions:
        raise ValueError(f"Score {grade_data.score} cannot exceed total number of questions {total_questions}")

    submission.score = grade_data.score
    submission.feedback = grade_data.feedback
    submission.graded_by = grade_data.graded_by
    submission.graded_at = datetime.utcnow()

    db.commit()
    db.refresh(submission)
    return submission


def update_grade(db: Session, submission_id: int, updates: schemas.GradedAssignmentUpdate) -> models.AssignmentSubmission:
    submission = db.query(models.AssignmentSubmission).filter_by(id=submission_id).first()
    if not submission:
        raise ValueError("Submission not found")

    for field, value in updates.dict(exclude_unset=True).items():
        setattr(submission, field, value)

    db.commit()
    db.refresh(submission)
    return submission

def get_grades_for_student(db: Session, student_id: int) -> List[models.AssignmentSubmission]:
    return db.query(models.AssignmentSubmission)\
        .filter_by(student_id=student_id)\
        .filter(models.AssignmentSubmission.score != None)\
        .all()

def get_admin_assignments_overview(
    db: Session,
    class_level: Optional[str] = None,
    department: Optional[str] = None,
    student_name: Optional[str] = None,
    date_given: Optional[date] = None,
    status: Optional[str] = None
):
    query = db.query(Assignment).options(
        selectinload(Assignment.submissions).selectinload(AssignmentSubmission.student),
        selectinload(Assignment.subject),
        joinedload(Assignment.teacher),
        selectinload(Assignment.theory_questions),
        selectinload(Assignment.objective_questions),
    )

    if class_level:
        query = query.filter(Assignment.class_level.ilike(class_level))

    if department:
        query = query.join(Subject).filter(Subject.department.ilike(department))

    if date_given:
        query = query.filter(func.date(Assignment.due_date) == date_given)

    assignments = query.order_by(Assignment.due_date.desc()).all()

    overview = []

    for assignment in assignments:
        # Query all students expected to submit this assignment
        student_query = db.query(User).filter(User.level.ilike(assignment.class_level))

        if assignment.subject and assignment.subject.department:
            student_query = student_query.filter(
                or_(
                    User.department == None,
                    User.department == "",
                    User.department.ilike(assignment.subject.department)
                )
            )

        total_students = student_query.count()

        # Handle student filter
        target_student = None
        if student_name:
            target_student = student_query.filter(User.full_name.ilike(f"%{student_name}%")).first()
            if not target_student:
                continue  # Skip this assignment if student not in the class/department

        # Determine submission for the student (if filtered by student_name)
        student_submission = None
        if target_student:
            student_submission = next(
                (s for s in assignment.submissions if s.student_id == target_student.id),
                None
            )

        # Calculate completed and pending counts
        if target_student:
            completed = 1 if student_submission and student_submission.score is not None else 0
            pending = 1 if not student_submission else (1 if student_submission.score is None else 0)
        else:
            completed = len([s for s in assignment.submissions if s.score is not None])
            pending = total_students - completed

        # Apply status filter properly
        if status == "completed" and completed == 0:
            continue
        if status == "pending" and pending == 0:
            continue

        # Prepare submissions list for the UI
        if target_student:
            submissions = [student_submission] if student_submission else []
        elif status:
            # Filter all submissions by status if no student_name filter
            if status == "completed":
                submissions = [s for s in assignment.submissions if s.score is not None]
            else:
                submissions = [s for s in assignment.submissions if s.score is None]
        else:
            submissions = assignment.submissions

        overview.append(AssignmentAdminOut(
            id=assignment.id,
            title=assignment.title,
            description=assignment.description,
            due_date=assignment.due_date,
            subject=assignment.subject,
            teacher=assignment.teacher,
            class_level=assignment.class_level,
            theory_questions=assignment.theory_questions,
            objective_questions=assignment.objective_questions,
            submissions=submissions,
            total_submissions=len(assignment.submissions),
            total_students=total_students,
            completed_submissions=completed,
            pending_submissions=pending
        ))

    return overview

def determine_assignment_status(assignment, student_id):
    """
    Determines the status of an assignment for a specific student.

    Possible return values:
    - "submitted"
    - "graded"
    - "missed"
    - "not_submitted"
    """
    for submission in assignment.submissions:
        if submission.student_id == student_id:
            return submission.status  # This is already 'submitted', 'graded', or 'missed' in your model

    return "not_submitted"  # Student hasn't submitted at all

def get_approved_children_by_parent(db: Session, parent_id: int):
    return (
        db.query(User)
        .join(models.ParentChildAssociation, models.ParentChildAssociation.child_id == models.User.id)
        .filter(models.ParentChildAssociation.parent_id == parent_id, models.ParentChildAssociation.approved == True)
        .all()
    )

def is_child_linked_to_parent(db: Session, parent_id: int, child_id: int):
    return (
        db.query(models.ParentChildAssociation)
        .filter_by(parent_id=parent_id, child_id=child_id, approved=True)
        .first()
        is not None
    )

def get_student_dashboard_data(db: Session, student_id: int):
    # You can customize this as needed — here's a basic mockup
    return schemas.StudentDashboardOut(
        student_name="Jane Doe",
        date=date.today(),
        current_week=31,
        today_topics=[],
        assignments=[],
        progress=schemas.DashboardProgress(score=90, total=100),
        upcoming_events=[],
        today_schedule=[],
    )
