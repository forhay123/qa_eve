# backend/app/routers/students.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User
from ..schemas import UserOut, UserUpdate
from ..dependencies import get_current_admin_user, get_current_student_user
from sqlalchemy import func
from ..services.student_dashboard_service import get_student_dashboard_data
from ..schemas import StudentDashboardOut

router = APIRouter()

# ----------------------
# Admin: List all students
# ----------------------
@router.get("/", response_model=List[UserOut])
def get_all_students(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    return db.query(User).filter(User.role == "student").all()

# ----------------------
# Admin: Delete a student by ID
# ----------------------
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# ----------------------
# Admin: Update a student by ID
# ----------------------
@router.put("/{student_id}", response_model=UserOut)
def update_student(
    student_id: int,
    updates: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for field, value in updates.dict(exclude_unset=True).items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student

# ----------------------
# Admin: Get students by class (level + department)
# ----------------------
@router.get("/by-class", response_model=List[UserOut])
def get_students_by_class(
    level: str,
    department: str = "",
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    level = level.strip().lower()
    department = department.strip().lower()

    query = db.query(User).filter(
        func.lower(User.role) == "student",
        func.lower(User.level) == level
    )

    if level.startswith("ss") and department:
        query = query.filter(func.lower(User.department) == department)

    return query.all()



from ..dependencies import get_current_teacher_user

@router.get("/by-class-teacher", response_model=List[UserOut])
def get_students_by_class_for_teacher(
    level: str,
    department: str = "",
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher_user),
):
    level = level.strip().lower()
    department = department.strip().lower()

    query = db.query(User).filter(
        func.lower(User.role) == "student",
        func.lower(User.level) == level
    )

    if level.startswith("ss") and department:
        query = query.filter(func.lower(User.department) == department)

    return query.all()



@router.get("/dashboard", response_model=StudentDashboardOut)
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student_user)
):
    return get_student_dashboard_data(db, current_user)
