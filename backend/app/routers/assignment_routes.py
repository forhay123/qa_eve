from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from .. import models, schemas, crud
from ..dependencies import (
    get_db,
    get_current_user as get_current_active_user,
    get_current_teacher_user,
    get_current_student_user,
    RoleChecker
)
from sqlalchemy import func, and_
from ..models import TeacherProfile, Assignment
from ..crud import get_submissions_for_student
from datetime import datetime, date


router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
)

# ------------------------ Shared ------------------------

@router.get("/", response_model=List[schemas.AssignmentOut])
def get_assignments_for_class(
    class_level: str,  # ✅ renamed from 'level'
    subject: str,
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_active_user),
):
    return crud.get_assignments_for_class(db, class_level, subject, topic)
# ------------------------ Student ------------------------

@router.get("/my", response_model=List[schemas.AssignmentOut])
def get_my_assignments_for_student(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_student_user),
):
    subjects = db.query(models.Subject).filter(
        models.Subject.level.ilike(current_user.level),
        (models.Subject.department.ilike(current_user.department)) |
        (models.Subject.department == None) |
        (func.length(func.trim(models.Subject.department)) == 0)
    ).all()

    all_assignments = []
    for subject in subjects:
        assignments = crud.get_assignments_for_class(
            db=db,
            class_level=current_user.level,
            subject_id=subject.id,
            student_id=current_user.id  # ✅ pass current student id
        )
        all_assignments.extend(assignments)

    return all_assignments




@router.post("/submit", response_model=schemas.AssignmentSubmissionOut)
def submit_assignment(
    submission: schemas.AssignmentSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_student_user),
):
    # Override student_id to ensure only the logged-in student is used
    submission.student_id = current_user.id
    return crud.submit_assignment(db=db, submission=submission)




@router.get("/student/my-submissions", response_model=List[schemas.AssignmentSubmissionOut])
def get_my_submissions(current_user: models.User = Depends(get_current_student_user), db: Session = Depends(get_db)):
    submissions = get_submissions_for_student(db, current_user.id)

    for sub in submissions:
        for ta in sub.theory_answers:
            print("✅ THEORY ID:", ta.id)
            print("✅ QUESTION:", ta.question)  # This should not be None
            print("✅ TEXT:", ta.question.question_text if ta.question else "❌ No question found")

        for oa in sub.objective_answers:
            print("✅ OBJECTIVE ID:", oa.id)
            print("✅ QUESTION:", oa.question.question_text if oa.question else "❌ No objective question")

    return submissions


@router.get("/student/grades", response_model=List[schemas.GradedAssignmentOut])
def get_my_grades(
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["student"]))
):
    return crud.get_grades_for_student(db, user.id)

# ------------------------ Teacher ------------------------

@router.get("/teacher/my", response_model=List[schemas.AssignmentOut])
def get_my_assignments(
    db: Session = Depends(get_db),
    current_teacher: TeacherProfile = Depends(get_current_teacher_user),
):
    print("📌 TeacherProfile ID:", current_teacher.id)
    print("👤 User ID:", current_teacher.user_id)

    assignments = db.query(Assignment)\
        .options(joinedload(Assignment.subject))\
        .filter(Assignment.teacher_id == current_teacher.user_id)\
        .order_by(Assignment.due_date.desc())\
        .all()

    return assignments



@router.post("/", response_model=schemas.AssignmentOut)
def create_assignment(
    assignment: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    teacher_profile: models.TeacherProfile = Depends(get_current_teacher_user)
):
    return crud.create_assignment(db, assignment, teacher_id=teacher_profile.user_id)

@router.post("/grade", response_model=schemas.GradedAssignmentOut)
def grade_submission(
    grade: schemas.GradedAssignmentCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["teacher", "admin"]))
):
    return crud.grade_submission(db, grade)

@router.put("/grade/{grade_id}", response_model=schemas.GradedAssignmentOut)
def update_grade(
    grade_id: int,
    updates: schemas.GradedAssignmentUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["teacher", "admin"]))
):
    return crud.update_grade(db, grade_id, updates)


@router.get("/teacher/assignments/submissions", response_model=List[schemas.AssignmentOut])
def get_assignments_with_submissions_for_teacher(
    db: Session = Depends(get_db),
    current_teacher: models.TeacherProfile = Depends(get_current_teacher_user),
):
    assignments = (
        db.query(models.Assignment)
        .filter(models.Assignment.teacher_id == current_teacher.user_id)
        .options(
            selectinload(models.Assignment.submissions).selectinload(models.AssignmentSubmission.student),
            selectinload(models.Assignment.subject),
            selectinload(models.Assignment.teacher),
            selectinload(models.Assignment.theory_questions),
            selectinload(models.Assignment.objective_questions),
        )
        .order_by(models.Assignment.due_date.desc())
        .all()
    )
    return assignments

# ------------------------ Per Assignment ------------------------

@router.get("/{assignment_id}/submissions", response_model=List[schemas.AssignmentSubmissionOut])
def get_submissions_for_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["teacher", "admin"]))
):
    return crud.get_submissions_for_assignment(db, assignment_id)

@router.put("/{assignment_id}", response_model=schemas.AssignmentOut)
def update_assignment(
    assignment_id: int,
    updates: schemas.AssignmentUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["teacher"]))
):
    return crud.update_assignment(db, assignment_id, updates)

@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["teacher"]))
):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code=404, detail="Assignment not found")
    return

@router.get("/{assignment_id}", response_model=schemas.AssignmentOut)
def get_single_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_active_user),
):
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment



@router.get("/admin/overview", response_model=List[schemas.AssignmentAdminOut])
def get_admin_assignments_overview(
    class_level: Optional[str] = None,
    department: Optional[str] = None,
    student_name: Optional[str] = None,
    date_given: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["admin"]))
):
    return crud.get_admin_assignments_overview(
        db=db,
        class_level=class_level,
        department=department,
        student_name=student_name,
        date_given=date_given,
        status=status
    )



@router.get("/admin/assignments/{assignment_id}/submissions", response_model=List[schemas.AssignmentSubmissionOut])
def get_assignment_submissions_admin(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["admin"]))  # Ensure only admin can use this
):
    submissions = (
        db.query(models.AssignmentSubmission)
        .filter(models.AssignmentSubmission.assignment_id == assignment_id)
        .options(
            selectinload(models.AssignmentSubmission.student),
        )
        .order_by(models.AssignmentSubmission.submitted_at.desc())
        .all()
    )
    return submissions


@router.post("/auto-grade-late")
def auto_grade_late_submissions(
    db: Session = Depends(get_db),
    user: models.User = Depends(RoleChecker(["admin", "teacher", "student"]))
):
    now = datetime.utcnow()

    assignments = (
        db.query(models.Assignment)
        .join(models.Subject, models.Assignment.subject_id == models.Subject.id)
        .filter(models.Assignment.due_date < now)
        .options(selectinload(models.Assignment.subject))
        .all()
    )

    total_updated = 0

    for assignment in assignments:
        subject = assignment.subject

        # Get all students in the class
        students_in_class = db.query(models.User).filter(
            models.User.student_class == assignment.class_level,
            models.User.role == "student"
        ).all()

        for student in students_in_class:
            # Handle departmental vs general subject
            if subject.department and subject.department.strip():
                # Departmental subject: Skip students from other departments
                if student.department != subject.department:
                    continue

            # Check for existing submission
            submission = db.query(models.AssignmentSubmission).filter(
                models.AssignmentSubmission.assignment_id == assignment.id,
                models.AssignmentSubmission.student_id == student.id
            ).first()

            if not submission:
                # Student did not submit -> Auto create missed submission
                late_submission = models.AssignmentSubmission(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    file_url="",
                    submitted_at=None,
                    score=0.0,
                    status="missed"
                )
                db.add(late_submission)
                total_updated += 1

            elif submission.status in ["submitted", "pending"]:
                # Student submitted but not completed or graded -> Auto mark as missed
                submission.status = "missed"
                submission.score = 0.0
                total_updated += 1

            # If status is "completed", do nothing

    db.commit()

    return {
        "message": "Auto-grading of late assignments completed.",
        "count_updated": total_updated
    }
