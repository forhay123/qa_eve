import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..schemas import StudentProfileCreate, StudentProfileOut, StudentProfileUpdate
from .. import crud
from ..database import get_db
from ..models import User
from ..dependencies import get_current_user, get_current_admin_user, get_current_student_user
from ..config import PROFILE_IMAGE_DIR

router = APIRouter(prefix="/student_profiles", tags=["Student Profiles"])

@router.get("/me", response_model=StudentProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    student_user: User = Depends(get_current_student_user)
):
    try:
        profile = crud.get_student_profile_by_user_id(db, student_user.id)
        if not profile:
            default_profile = StudentProfileCreate(
                user_id=student_user.id,
                guardian_name="",
                contact_number="",
                address="",
                admission_date=None
            )
            profile = crud.create_student_profile(db, default_profile)
        return profile
    except Exception as e:
        print(f"💥 Error in /me profile route: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving student profile")

@router.put("/me", response_model=StudentProfileOut)
def update_my_profile(
    updates: StudentProfileUpdate,
    db: Session = Depends(get_db),
    student_user: User = Depends(get_current_student_user)
):
    try:
        profile = crud.get_student_profile_by_user_id(db, student_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return crud.update_student_profile(db, profile, updates)
    except Exception as e:
        print(f"💥 Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.put("/me/image", response_model=StudentProfileOut)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    student_user: User = Depends(get_current_student_user)
):
    try:
        profile = crud.get_student_profile_by_user_id(db, student_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="Student profile not found")

        os.makedirs(PROFILE_IMAGE_DIR, exist_ok=True)

        ext = file.filename.split('.')[-1].lower()
        if ext not in {"jpg", "jpeg", "png"}:
            raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG files are allowed")

        filename = f"profile_{student_user.id}.{ext}"
        save_path = PROFILE_IMAGE_DIR / filename

        with open(save_path, "wb") as f:
            f.write(await file.read())

        profile.profile_image = f"/static/profiles/{filename}"
        db.commit()
        db.refresh(profile)

        return profile

    except Exception as e:
        print(f"💥 Error uploading profile image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.get("/", response_model=list[StudentProfileOut])
def list_profiles(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return crud.get_all_student_profiles(db)

@router.post("/", response_model=StudentProfileOut)
def create_profile(
    profile: StudentProfileCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return crud.create_student_profile(db, profile)

@router.put("/{user_id}", response_model=StudentProfileOut)
def update_profile(
    user_id: int,
    updates: StudentProfileUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    db_profile = crud.get_student_profile_by_user_id(db, user_id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return crud.update_student_profile(db, db_profile, updates)
