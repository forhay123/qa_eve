from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel, OAuthFlowPassword
from fastapi.openapi.utils import get_openapi
from fastapi.security import SecurityScopes
from fastapi import Security

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import os
import requests
import json
import re
from pathlib import Path

# New import for serving files
from fastapi.responses import FileResponse

from . import database, crud, schemas, models
from .schemas import QuestionOut, TopicOut
from .database import get_db
from .models import Question
from .services.pdf_parser import extract_text_from_pdf
from .services.answer_checker import check_answer
from .auth import authenticate_user, create_access_token, get_current_user, get_password_hash
from app.routers import (
    subjects, students, topics, progress, answers, topic_questions,
    admin_progress, timetable, student_profile, attendance,
    test_exam, report_generator, personalization, teachers, parents,
    auth_router, quizzes, achievements, resources, classes, admin, users,
    chat_router, student_progress, assignment_routes, admin_dashboard_router, admin_activity, ask_me_anything
)
from .services.qa_generator import split_text_into_chunks, generate_questions_from_pdf_text
from .config import PROFILE_IMAGE_DIR
from app.routers.messaging_router import router as messaging_router
from app.routers import parent_dashboard_router


# -------------------- App Initialization --------------------

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# Optional: custom OpenAPI config for docs (descriptive)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="My Educational Platform API",
        version="1.0.0",
        description="API for students, teachers, and admins",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/token",
                    "scopes": {}
                }
            }
        }
    }
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            openapi_schema["paths"][path][method]["security"] = [{"OAuth2PasswordBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# -------------------- CORS --------------------

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") or [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Static/Upload Folders --------------------

# Absolute base directory
BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_FOLDER = BASE_DIR / "data" / "uploaded_pdfs"
LESSON_FOLDER = BASE_DIR / "data" / "lesson_pdfs"
UPLOAD_DIR = BASE_DIR / "data" / "uploaded_resources"
PROFILE_IMAGE_DIR = BASE_DIR / "static" / "profiles"

# Ensure directories exist
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
LESSON_FOLDER.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROFILE_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# Mount with absolute path
app.mount("/lesson-pdfs", StaticFiles(directory=str(LESSON_FOLDER)), name="lesson_pdfs")
app.mount("/uploaded_pdfs", StaticFiles(directory=str(UPLOAD_FOLDER)), name="uploaded_pdfs")
app.mount("/resources-files", StaticFiles(directory=str(UPLOAD_DIR)), name="resources_files")
app.mount("/statical/profiles", StaticFiles(directory=str(PROFILE_IMAGE_DIR)), name="profile_images")
app.mount("/static", StaticFiles(directory="uploaded_files"), name="static")

# -------------------- Serve Frontend --------------------

# Mount React's build folder
FRONTEND_DIST = BASE_DIR / "app" / "static" / "dist"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIST)), name="static_frontend")

# Root route → serve React index.html
@app.get("/")
async def serve_frontend():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Frontend not built yet"}

# Catch-all → let React Router handle client-side routes
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Frontend not built yet"}

# -------------------- Database Setup --------------------

database.Base.metadata.create_all(bind=database.engine)


# -------------------- Routers --------------------

app.include_router(subjects.router)
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(topics.router)
app.include_router(progress.router)
app.include_router(answers.router)
app.include_router(topic_questions.router)
app.include_router(timetable.router)
app.include_router(student_profile.router)
app.include_router(attendance.router)
app.include_router(test_exam.router)
app.include_router(report_generator.router)
app.include_router(personalization.router)
app.include_router(teachers.router)
app.include_router(parents.router)
app.include_router(auth_router.router)
app.include_router(quizzes.router, prefix="/student", tags=["Quizzes"])
app.include_router(achievements.router)
app.include_router(resources.router)
app.include_router(classes.router)
app.include_router(admin.admin_router)
app.include_router(admin_progress.router)
app.include_router(users.router)
app.include_router(chat_router.router)
app.include_router(student_progress.router)
app.include_router(assignment_routes.router)
app.include_router(messaging_router)
app.include_router(admin_dashboard_router.router)
app.include_router(admin_activity.router)
app.include_router(ask_me_anything.router)
app.include_router(parent_dashboard_router.router)



print("✅ Timetable router imported successfully")
print("\n✅ Registered Routes:")
for route in app.routes:
    print(f"{route.path} → {route.name}")


# -------------------- Auth Routes --------------------

@app.post("/register/", response_model=schemas.UserOut)
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can register new users.")

    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = get_password_hash(user.password)

    normalized_level = user.student_class.strip().lower() if user.student_class else None

    # Auto-generate email if not provided
    generated_email = user.email or f"{user.username}@qaacademy.com"

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        role=user.role.strip().lower(),
        full_name=user.full_name,
        student_class=user.student_class,
        state_of_origin=user.state_of_origin,
        level=normalized_level,
        department=user.department,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.get("/me/", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/admin-only")
def admin_only(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"message": f"Welcome, admin {current_user.username}!"}

# -------------------- Student Management --------------------

@app.get("/students/", response_model=List[schemas.UserOut])
def list_students(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can view students.")
    return db.query(models.User).filter(models.User.is_admin == False).all()

@app.put("/students/{student_id}", response_model=schemas.UserOut)
def update_student(student_id: int, updated_data: schemas.UserUpdate = Body(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update students.")
    student = db.query(models.User).filter(models.User.id == student_id, models.User.is_admin == False).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field, value in updated_data.dict(exclude_unset=True).items():
        setattr(student, field, value)
    if 'student_class' in updated_data.dict(exclude_unset=True):
        student.level = updated_data.student_class.strip().lower()
    db.commit()
    db.refresh(student)
    return student

# -------------------- Question Generation (Manual + Upload) --------------------

def generate_questions_from_text(text_chunk: str, max_questions: int = 35, model: str = "llama3"):
    prompt = f"""
Generate up to {max_questions} question-answer pairs from the following text.
Respond ONLY in this exact JSON format:
[
  {{ "question": "...", "answer": "..." }},
  ...
]

No explanations, no markdown, no other text.

Text:
{text_chunk}
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt.strip(), "stream": False},
            timeout=120
        )
        response.raise_for_status()
        output_text = response.json()["response"].strip()

        # Strip code block formatting
        output_text = re.sub(r"```(?:json)?", "", output_text, flags=re.IGNORECASE).strip("`\n ")

        try:
            parsed = json.loads(output_text)
            if isinstance(parsed, list):
                return parsed[:max_questions]
        except json.JSONDecodeError:
            pass

        pattern = r'{\s*"question"\s*:\s*".+?",\s*"answer"\s*:\s*".+?"\s*}'
        matches = re.findall(pattern, output_text, flags=re.DOTALL)

        qa_pairs = []
        for m in matches:
            try:
                qa_pairs.append(json.loads(m))
            except:
                continue

        if qa_pairs:
            return qa_pairs[:max_questions]

        raise ValueError("No valid JSON array or objects found in model output.")

    except Exception as e:
        print("❌ Generation failed:", e)
        return [{
            "question": "Error generating question",
            "answer": str(e)
        }]


# -------------------- PDF Upload & QA --------------------

@app.post("/upload/")
def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())
    with open(filepath, "rb") as pdf_file:
        text = extract_text_from_pdf(pdf_file)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Failed to extract text.")
    pdf_record = crud.create_pdf(db, schemas.PDFDocumentCreate(filename=file.filename, text=text))
    try:
        qa_pairs = generate_questions_from_text(text)
        for pair in qa_pairs:
            crud.create_question(db, schemas.QuestionCreate(
                question=pair["question"],
                answer=pair.get("answer", "Answer not provided"),
                document_id=pdf_record.id,
            ))
        return {"pdf_id": pdf_record.id, "message": "Upload and question generation successful"}
    except Exception as e:
        print("❌ QA generation failed:", e)
        return {"pdf_id": pdf_record.id, "message": "Upload successful, QA failed"}

@app.post("/generate-questions/{pdf_id}", response_model=List[schemas.QuestionOut])
def generate_questions(pdf_id: int, max_per_chunk: int = Query(35), max_total: int = Query(100), db: Session = Depends(get_db)):
    pdf = db.get(models.PDFDocument, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    chunks = split_text_into_chunks(pdf.text, max_words=800)
    total_max = min(len(chunks) * max_per_chunk, max_total)
    all_qa_pairs = generate_questions_from_pdf_text(pdf.text, total_max_questions=total_max, max_per_chunk=max_per_chunk)[:50]
    created = []
    for pair in all_qa_pairs:
        created.append(crud.create_question(db, schemas.QuestionCreate(
            question=pair["question"],
            answer=pair.get("answer", "Answer not provided"),
            document_id=pdf_id,
        )))
    return created

# -------------------- Answer Submission --------------------

@app.post("/answer/", response_model=schemas.UserAnswerOut)
def submit_answer(answer: schemas.UserAnswerCreate, db: Session = Depends(get_db)):
    if not answer.user_id.strip():
        raise HTTPException(status_code=400, detail="User ID is required")
    question = db.get(models.Question, answer.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    is_correct, _ = check_answer(answer.answer, question.answer)
    user_answer_record = crud.save_user_answer(db, answer, is_correct, correction=question.answer)
    return schemas.UserAnswerOut(
        id=user_answer_record.id,
        user_id=user_answer_record.user_id,
        question_id=user_answer_record.question_id,
        answer=user_answer_record.answer,
        is_correct=user_answer_record.is_correct,
        correct_answer=question.answer
    )

# -------------------- Misc --------------------

@app.get("/questions/by-pdf/{pdf_id}", response_model=List[QuestionOut])
def get_questions_for_pdf(pdf_id: int, db: Session = Depends(get_db)):
    questions = db.query(Question).filter(Question.document_id == pdf_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")
    return questions

@app.get("/test-llama/")
def test_llama():
    sample = "Photosynthesis is the process by which green plants produce food from sunlight."
    return generate_questions_from_text(sample, max_questions=3)

@app.get("/subjects/{level}/{subject}/topics", response_model=List[TopicOut])
def get_topics(level: str, subject: str, db: Session = Depends(get_db)):
    return crud.get_topics_by_subject(level, subject, db)


@app.get("/test-alive")
def test():
    return {"status": "ok"}


for route in app.routes:
    print(f"Route: {route.path}, Name: {route.name}, Type: {type(route).__name__}")


@app.get("/test-connection")
def test_connection():
    return {"message": "Backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}