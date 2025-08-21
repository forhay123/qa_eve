# backend/app/routers/auth_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import auth, database, models, schemas
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(
    prefix="auth",
    tags=["Auth"]
)

@router.post("/token", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid username or password"
        )

    access_token = auth.create_access_token(data={
        "sub": user.username,
        "user_id": user.id,
        "role": user.role or "student"
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# Optional: User info route for simple frontend use
@router.get("/user-info", response_model=schemas.FlatUserResponse)
def get_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    user_data = {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "email": current_user.email,
    }

    if current_user.role == "teacher":
        teacher_profile = db.query(models.TeacherProfile).filter_by(user_id=current_user.id).first()
        user_data["level"] = teacher_profile.level if teacher_profile else "teacher"
        user_data["department"] = teacher_profile.department if teacher_profile else "teacher"

    elif current_user.role == "student":
        user_data["level"] = current_user.level or "student"
        user_data["department"] = current_user.department or "student"

    elif current_user.role == "admin":
        user_data["level"] = "admin"
        user_data["department"] = "admin"

    else:
        user_data["level"] = current_user.role
        user_data["department"] = current_user.role

    return user_data
