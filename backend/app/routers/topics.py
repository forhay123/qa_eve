from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import os

from ..database import get_db
from ..models import Topic, User, Subject, TopicQuestion, student_subject_association, StudentProfile
from ..schemas import TopicOut
from ..auth import get_current_user
from ..services.llama_qa import generate_questions_from_pdf
from ..utils import safe_filename
import traceback

router = APIRouter(prefix="/topics", tags=["Topics"])

UPLOAD_FOLDER = os.path.join("data", "lesson_pdfs")
PUBLIC_URL_PREFIX = "/lesson-pdfs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# -------------------- Get All Topics for Current User's Subjects --------------------
@router.get("/my-subjects", response_model=List[TopicOut])
def get_topics_for_user_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Get student profile (to get the student ID for association table)
        student_profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == current_user.id
        ).first()

        if not student_profile:
            raise HTTPException(status_code=404, detail="Student profile not found")

        # Safely normalize level and department from `users` table
        level = (current_user.level or "").strip().lower()
        department = (current_user.department or "").strip().lower()

        subject_ids = []

        # First, try fetching subjects via level/department
        if level:
            subjects_query = db.query(Subject).filter(func.lower(Subject.level) == level)

            if department:
                subjects_query = subjects_query.filter(func.lower(Subject.department) == department)
            else:
                subjects_query = subjects_query.filter(
                    (Subject.department == None) |
                    (func.length(func.trim(Subject.department)) == 0)
                )

            subjects = subjects_query.all()
            subject_ids.extend([subj.id for subj in subjects])

        # If no subjects from level/department, fall back to association table
        if not subject_ids:
            assoc_subjects = db.query(student_subject_association.c.subject_id).filter(
                student_subject_association.c.student_id == student_profile.id
            ).all()
            subject_ids.extend([sid for (sid,) in assoc_subjects])

        if not subject_ids:
            return []

        # Fetch topics for these subjects
        topics = (
            db.query(Topic)
            .filter(Topic.subject_id.in_(subject_ids))
            .options(joinedload(Topic.subject))
            .order_by(Topic.week_number)
            .all()
        )

        return topics

    except Exception as e:
        print("❌ Error in /topics/my-subjects:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

# -------------------- Get Topic by ID --------------------
@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(topic_id: int, request: Request, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if topic.pdf_url and not topic.pdf_url.startswith("http"):
        base_url = str(request.base_url).rstrip("/")
        topic.pdf_url = f"{base_url}{topic.pdf_url}"

    return topic



# -------------------- Update Topic (with PDF) --------------------
@router.put("/{topic_id}", response_model=TopicOut)
async def update_topic(
    topic_id: int,
    title: str = Form(...),
    week_number: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    try:
        topic.title = title.strip()
        topic.week_number = int(week_number.strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid title or week_number")

    if file:
        filename = safe_filename(file.filename, prefix=f"{topic_id}_{topic.title}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, "wb") as f:
            f.write(await file.read())

        topic.pdf_url = f"{PUBLIC_URL_PREFIX}/{filename}".replace("\\", "/")

        # Delete old questions
        db.query(TopicQuestion).filter(TopicQuestion.topic_id == topic_id).delete()
        db.commit()

        # Generate and save new questions
        try:
            new_questions = generate_questions_from_pdf(filepath, topic_id, db)
            for q in new_questions:
                db.add(q)
            db.commit()
        except Exception as e:
            print("❌ PDF/Question generation failed:", e)

    db.commit()
    db.refresh(topic)
    return topic


# -------------------- Upload Lesson PDF Only --------------------
@router.post("/upload-lesson-pdf/")
async def upload_lesson_pdf(file: UploadFile = File(...)):
    filename = safe_filename(file.filename, prefix="lesson")
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    with open(save_path, "wb") as f:
        f.write(await file.read())

    return {"pdf_url": f"{PUBLIC_URL_PREFIX}/{filename}".replace("\\", "/")}


# -------------------- Get Topics by Level + Subject --------------------

@router.get("/by-level-subject/{level}/{subject}", response_model=List[TopicOut])
def get_topics_by_level_subject(level: str, subject: str, db: Session = Depends(get_db)):
    topics = (
        db.query(Topic)
        .join(Subject)
        .filter(
            func.lower(Topic.level) == level.lower(),
            func.lower(Subject.name) == subject.lower()
        )
        .options(joinedload(Topic.subject))  # eager load subject
        .order_by(Topic.week_number)
        .all()
    )
    return topics




# -------------------- Create New Topic --------------------
@router.post("/subjects/{level}/{subject}/topics", response_model=TopicOut)
async def create_topic_by_level_subject(
    level: str,
    subject: str,
    title: str = Form(...),
    week_number: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    subj = db.query(Subject).filter(
        func.lower(Subject.level) == level.lower(),
        func.lower(Subject.name) == subject.lower()
    ).first()

    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        week_num = int(week_number.strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="Week number must be a valid integer")

    new_topic = Topic(
        subject_id=subj.id,
        level=subj.level.strip(),
        title=title.strip(),
        week_number=week_num,
    )

    filepath = None
    if file:
        filename = safe_filename(file.filename, prefix=f"{subj.name}_{week_num}_{title}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, "wb") as f:
            f.write(await file.read())
        new_topic.pdf_url = f"{PUBLIC_URL_PREFIX}/{filename}".replace("\\", "/")

    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)

    if filepath:
        try:
            questions = generate_questions_from_pdf(filepath, new_topic.id, db)
            for q in questions:
                db.add(q)
            db.commit()
        except Exception as e:
            print("⚠️ Question generation failed:", e)

    return new_topic


# -------------------- Delete Topic + Questions + PDF --------------------
@router.delete("/{topic_id}")
def delete_topic_and_questions(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    topic = db.query(Topic).filter_by(id=topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.query(TopicQuestion).filter_by(topic_id=topic_id).delete()

    if topic.pdf_url:
        filename = topic.pdf_url.replace("/lesson-pdfs/", "")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"❌ Failed to delete file: {filepath}", e)

    db.delete(topic)
    db.commit()
    return {"message": "Topic and associated questions deleted"}


@router.get("/by-ids", response_model=List[TopicOut])
def get_topics_by_ids(ids: List[int], request: Request, db: Session = Depends(get_db)):
    topics = db.query(Topic).filter(Topic.id.in_(ids)).all()

    base_url = str(request.base_url).rstrip("/")
    for topic in topics:
        if topic.pdf_url and not topic.pdf_url.startswith("http"):
            topic.pdf_url = f"{base_url}{topic.pdf_url}"

    return topics



@router.patch("/{topic_id}/toggle-approval", response_model=TopicOut)
async def toggle_pdf_approval(
    topic_id: int,
    is_pdf_approved: bool = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.is_pdf_approved = is_pdf_approved
    db.commit()
    db.refresh(topic)
    return topic
