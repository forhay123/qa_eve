# backend/app/routers/users.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User
from ..schemas import UserOut, MeResponse, StudentProfileOut, TeacherProfileWithUser
from ..dependencies import get_current_admin_user, get_current_user
from .. import models

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

# ✅ Admin-only: Get all users
@router.get("/", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return db.query(User).all()


# ✅ Admin and Teacher: Get all student users
@router.get("/students/", response_model=List[UserOut])
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).filter(User.role == "student").all()


# ✅ /users/me - dynamic profile for logged-in user
@router.get("/me", response_model=MeResponse)
async def get_me(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role == "teacher":
        teacher = (
            db.query(models.TeacherProfile)
            .options(joinedload(models.TeacherProfile.user))
            .filter(models.TeacherProfile.user_id == user.id)
            .first()
        )
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        return TeacherProfileWithUser.from_orm(teacher)

    elif user.role == "student":
        student = (
            db.query(models.StudentProfile)
            .options(joinedload(models.StudentProfile.user))
            .filter(models.StudentProfile.user_id == user.id)
            .first()
        )
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")
        return StudentProfileOut.from_orm(student)

    return UserOut.from_orm(user)
