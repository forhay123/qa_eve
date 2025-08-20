from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from sqlalchemy import distinct
import os
import shutil
from .. import models

from ..models import Resource, StudentProfile, Subject, TeacherSubject  
from ..schemas import ResourceOut
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/resources", tags=["Resources"])
RESOURCE_DIR = "data/lesson_pdfs"

def validate_subject_name(subject_str: str, db: Session) -> str:
    subject = db.query(models.Subject).filter(
        models.Subject.name.ilike(subject_str.strip())
    ).first()
    if not subject:
        raise HTTPException(status_code=400, detail=f"Invalid subject name: '{subject_str}'")
    return subject.name  # Return exact casing



# ✅ Upload endpoint (admin or teacher)

@router.post("/", response_model=ResourceOut)
def upload_resource(
    title: str = Form(...),
    description: str = Form(...),
    subject: str = Form(...),
    level: str = Form(...),
    student_class: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # ✅ Canonicalize subject name and get matching Subject object
    canonical_subject = validate_subject_name(subject, db)
    subject_obj = db.query(Subject).filter(Subject.name.ilike(canonical_subject)).first()

    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")

    # ✅ If teacher, validate subject assignment
    if user.role == "teacher":
        assignment_exists = (
            db.query(TeacherSubject)
            .filter(
                TeacherSubject.teacher_id == user.id,
                TeacherSubject.subject_id == subject_obj.id
            )
            .first()
        )
        if not assignment_exists:
            raise HTTPException(status_code=403, detail="You are not assigned to this subject")

    # ✅ Save file to disk
    os.makedirs(RESOURCE_DIR, exist_ok=True)
    filename = f"{user.id}_{file.filename}"
    filepath = os.path.join(RESOURCE_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ✅ Save to DB
    resource = Resource(
        title=title,
        description=description,
        subject=subject_obj.name,  # or subject_obj.id if your model uses FK
        level=level,
        student_class=student_class,
        file_path=filepath,
        uploaded_by=user.id
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.get("/", response_model=List[ResourceOut])
def list_resources(
    subject: str = "", level: str = "", student_class: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if subject:
        query = query.filter(Resource.subject.ilike(f"%{subject}%"))

    if level:
        level = level.lower()
        if level in ["ss1", "ss2", "ss3"]:
            level_filter = "senior"
        elif level in ["jss1", "jss2", "jss3"]:
            level_filter = "junior"
        elif level in ["junior", "senior"]:
            level_filter = level
        else:
            level_filter = ""
        if level_filter:
            query = query.filter(Resource.level == level_filter)

    if student_class:
        query = query.filter(Resource.student_class == student_class)

    return query.all()

@router.get("/download/{resource_id}")
def download_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return FileResponse(resource.file_path, filename=os.path.basename(resource.file_path))

@router.get("/subjects")
def get_resource_subjects(db: Session = Depends(get_db)):
    subjects = db.query(distinct(Resource.subject)).all()
    return [s[0] for s in subjects if s[0]]



@router.get("/student", response_model=List[ResourceOut])
def get_student_resources(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this route")

    if not user.level:
        raise HTTPException(status_code=400, detail="Student level not set")
    
    level = user.level.lower()
    department = user.department.lower() if user.department else None

    try:
        compulsory_query = db.query(Subject).filter(
            Subject.level.ilike(level),
            Subject.department == None
        )

        if department:
            dept_query = db.query(Subject).filter(
                Subject.level.ilike(level),
                Subject.department.ilike(department)
            )
            subjects = compulsory_query.union(dept_query).all()
        else:
            subjects = compulsory_query.all()

        if not subjects:
            raise HTTPException(status_code=404, detail="No subjects found for this student")

        subject_names = [s.name for s in subjects]

        resources = db.query(Resource).filter(
            Resource.subject.in_(subject_names),
            Resource.student_class.ilike(user.student_class)
        ).all()

        return resources

    except Exception as e:
        print("❌ Error:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch resources")


