from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..services.llama_qa import generate_questions_from_pdf, generate_questions_by_type
from ..utils import safe_filename
from pathlib import Path
import shutil
import logging
import os

router = APIRouter(prefix="/topics", tags=["Topic Questions"])

# ✅ Setup paths using pathlib (consistent with main.py)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_FOLDER = BASE_DIR / "data" / "lesson_pdfs"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO)

def build_options(q):
    if all([q.option_a, q.option_b, q.option_c, q.option_d]):
        return {
            "a": q.option_a,
            "b": q.option_b,
            "c": q.option_c,
            "d": q.option_d,
        }
    return None

# ✅ GET /topics/{topic_id}/questions?qtype=objective|theory
@router.get("/{topic_id}/questions", response_model=list[schemas.TopicQuestionOut])
def get_topic_questions(
    topic_id: int,
    qtype: str = Query("objective", enum=["objective", "theory"]),
    db: Session = Depends(get_db),
):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    query = db.query(models.TopicQuestion).filter(models.TopicQuestion.topic_id == topic_id)

    if qtype == "objective":
        query = query.filter(models.TopicQuestion.question_type == "objective")
    else:
        query = query.filter(models.TopicQuestion.question_type == "theory")

    results = query.all()
    return [
        schemas.TopicQuestionOut(
            id=q.id,
            topic_id=q.topic_id,
            question=q.question,
            answer=q.answer,
            correct_answer=q.correct_answer,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            options=build_options(q),
        ) for q in results
    ]

# ✅ PUT /topics/{topic_id}/upload-pdf — Upload PDF and generate BOTH question types
@router.put("/{topic_id}/upload-pdf")
async def upload_topic_pdf(
    topic_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    filename = safe_filename(file.filename, prefix=topic.title or f"topic_{topic_id}")
    file_path = UPLOAD_FOLDER / filename

    # ✅ Save uploaded file
    try:
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        file.file.close()
        logging.info(f"✅ Saved new PDF to {file_path}")
    except Exception as e:
        logging.exception("❌ Failed to write new PDF")
        raise HTTPException(status_code=500, detail="❌ Failed to save PDF to disk")

    # ✅ Verify the file was written
    if not file_path.exists():
        logging.error("❌ File was not saved after writing!")
        raise HTTPException(status_code=500, detail="❌ File not saved")

    # ✅ Delete old PDF if different
    if topic.pdf_url:
        old_filename = os.path.basename(topic.pdf_url)
        old_file_path = UPLOAD_FOLDER / old_filename
        if old_filename != filename and old_file_path.exists():
            try:
                old_file_path.unlink()
                logging.info(f"🗑️ Deleted old PDF: {old_file_path}")
            except Exception as e:
                logging.warning(f"⚠️ Failed to delete old PDF: {old_file_path}")

    # ✅ Update topic with new PDF
    topic.pdf_url = f"/lesson-pdfs/{filename}"
    db.commit()
    db.refresh(topic)

    try:
        db.query(models.TopicQuestion).filter_by(topic_id=topic_id).delete()
        db.commit()

        generated = generate_questions_from_pdf(pdf_path=str(file_path), topic_id=topic_id, db=db)

        objective = [
            q for q in generated
            if q.correct_answer and all([q.option_a, q.option_b, q.option_c, q.option_d])
        ]
        theory = [
            q for q in generated
            if not q.correct_answer and not any([q.option_a, q.option_b, q.option_c, q.option_d])
        ]

        return {
            "message": "✅ PDF uploaded and questions generated.",
            "objective_questions_count": len(objective),
            "theory_questions_count": len(theory),
            "pdf_url": topic.pdf_url,
        }

    except Exception as e:
        logging.exception("❌ Generation failed")
        raise HTTPException(status_code=500, detail=f"❌ Failed to generate questions: {str(e)}")

# ✅ POST /topics/{topic_id}/generate-questions?qtype=objective|theory
@router.post("/{topic_id}/generate-questions")
def regenerate_questions_for_topic(
    topic_id: int,
    qtype: str = Query("objective", enum=["objective", "theory"]),
    db: Session = Depends(get_db),
):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if not topic.pdf_url:
        raise HTTPException(status_code=404, detail="No PDF is associated with this topic.")

    filename = topic.pdf_url.replace("/lesson-pdfs/", "").replace("\\", "/")
    pdf_path = UPLOAD_FOLDER / filename

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on server.")

    try:
        db.query(models.TopicQuestion).filter_by(topic_id=topic_id, question_type=qtype).delete()
        db.commit()

        generated = generate_questions_by_type(
            pdf_path=str(pdf_path),
            topic_id=topic_id,
            db=db,
            qtype=qtype
        )

        return {
            "message": f"{qtype.title()} questions regenerated successfully.",
            "count": len(generated),
        }

    except Exception as e:
        logging.exception("❌ Regeneration failed")
        raise HTTPException(status_code=500, detail=f"❌ Failed to generate {qtype} questions: {str(e)}")
