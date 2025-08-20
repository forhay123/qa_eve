from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/parent-dashboard",
    tags=["Parent Dashboard"]
)

def verify_parent_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can access this route")

    association = db.query(models.ParentChildAssociation).filter_by(
        parent_id=current_user.id,
        child_id=child_id,
        approved=True
    ).first()

    if not association:
        raise HTTPException(status_code=403, detail="No approved access to this child")

    return True

@router.get("/dashboard/{child_id}", response_model=schemas.StudentDashboardOut)
def get_dashboard_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_parent_child)
):
    student = db.query(models.User).filter(
        models.User.id == child_id,
        models.User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return schemas.StudentDashboardOut(
        student_id=student.id,
        full_name=student.full_name,
        level=student.level,
        recent_scores=[]
    )

@router.get("/children", response_model=List[schemas.ChildSummaryOut])
def get_approved_children(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_parent:
        raise HTTPException(status_code=403, detail="Only parents can view children")

    associations = db.query(models.ParentChildAssociation).filter_by(
        parent_id=current_user.id,
        approved=True
    ).all()

    return [
        schemas.ChildSummaryOut(
            id=assoc.child.id,
            full_name=assoc.child.full_name,
            level=assoc.child.level
        )
        for assoc in associations if assoc.child
    ]
