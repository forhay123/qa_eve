from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..models import User

admin_router = APIRouter(prefix="/admin", tags=["admin"])


# -------------------- Utils --------------------

def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
    return user


# -------------------- Admin Test --------------------

@admin_router.get("/admin-only")
def admin_only_route(current_user: User = Depends(require_admin)):
    return {"message": f"Welcome, admin {current_user.username}!"}


# -------------------- Assign Subject to Teacher --------------------

@admin_router.post("/assign-subject", status_code=201)
def assign_subject_to_teacher(
    data: schemas.TeacherSubjectAssign,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    teacher = db.query(User).filter(User.id == data.teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=404, detail="Teacher not found")

    subject = db.query(models.Subject).filter(models.Subject.id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    exists = db.query(models.TeacherSubject).filter_by(
        teacher_id=data.teacher_id, subject_id=data.subject_id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Subject already assigned to this teacher")

    assignment = models.TeacherSubject(teacher_id=data.teacher_id, subject_id=data.subject_id)
    db.add(assignment)
    db.commit()

    return {"message": f"{subject.name} assigned to {teacher.full_name or teacher.username}"}


# -------------------- List All Teachers --------------------

@admin_router.get("/teachers", response_model=List[schemas.UserOut])
def list_teachers(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    teachers = db.query(User).filter(User.role == "teacher").all()
    return teachers


# -------------------- List Teachers with Their Assigned Subjects --------------------

@admin_router.get("/teachers-with-subjects", response_model=List[schemas.TeacherWithSubjects])
def list_teachers_with_assigned_subjects(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    teachers = db.query(User).filter(User.role == "teacher").options(
        joinedload(User.subjects_taught).joinedload(models.TeacherSubject.subject)
    ).all()
    return teachers


# -------------------- Get All Classes --------------------

@admin_router.get("/classes", response_model=List[str])
def get_all_classes_for_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    class_levels = db.query(models.Subject.level).distinct().all()
    return [cl[0].upper() for cl in class_levels if cl[0]]


# -------------------- Assign Class to Teacher --------------------

@admin_router.post("/assign-class", status_code=201)
def assign_class_to_teacher(
    data: schemas.TeacherClassAssign,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    teacher = db.query(User).filter_by(id=data.teacher_id, role="teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing_profile = db.query(models.TeacherProfile).filter_by(user_id=data.teacher_id).first()

    if existing_profile:
        existing_profile.level = data.level
        existing_profile.department = data.department
        db.commit()
        return {"message": f"Updated class for teacher {teacher.full_name or teacher.username}"}

    new_profile = models.TeacherProfile(
        user_id=data.teacher_id,
        level=data.level,
        department=data.department,
    )
    db.add(new_profile)
    db.commit()

    return {"message": f"Assigned class {data.level}-{data.department} to {teacher.full_name or teacher.username}"}


# -------------------- List Approved Parents and Their Children --------------------

@admin_router.get("/parent-children", response_model=List[schemas.ParentWithChildrenOut])
def get_parents_with_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    associations = db.query(models.ParentChildAssociation).filter_by(approved=True).all()
    parent_map = {}

    for assoc in associations:
        parent = assoc.parent
        child = assoc.child

        if parent.id not in parent_map:
            parent_map[parent.id] = {
                "id": parent.id,
                "full_name": parent.full_name,
                "email": parent.email,
                "children": [],
            }

        parent_map[parent.id]["children"].append({
            "id": child.id,
            "full_name": child.full_name,
            "student_class": child.student_class,
            "level": child.level,
        })

    return list(parent_map.values())
