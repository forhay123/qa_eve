# app/routers/ask_me_anything.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import TopicQuestion
from app.config import OPENAI_API_KEY
import openai

openai.api_key = OPENAI_API_KEY

router = APIRouter(prefix="/ask", tags=["Ask Me Anything"])


# ✅ Request body schema
class AskRequest(BaseModel):
    subject: str
    question: str


@router.post("/")
async def ask_anything(payload: AskRequest, db: Session = Depends(get_db)):
    subject = payload.subject.strip()
    question = payload.question.strip()

    if not subject or not question:
        raise HTTPException(status_code=400, detail="Subject and question are required.")

    # Step 1: Check DB for a matching question
    result = (
        db.query(TopicQuestion)
        .filter(TopicQuestion.question.ilike(f"%{question}%"))
        .first()
    )

    if result:
        if result.question_type == "mcq" and result.correct_answer:
            # Build explanation prompt
            prompt = (
                f"You are an educational assistant. Explain why the correct answer to the following objective "
                f"question is option '{result.correct_answer}'.\n\n"
                f"Subject: {subject}\n"
                f"Question: {result.question}\n"
                f"Options:\n"
                f"A. {result.option_a}\n"
                f"B. {result.option_b}\n"
                f"C. {result.option_c}\n"
                f"D. {result.option_d}\n"
                f"\nExplain why option '{result.correct_answer}' is correct."
            )

            try:
                response = openai.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a helpful educational assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=400,
                    temperature=0.5
                )
                explanation = response.choices[0].message.content.strip()

                return {
                    "source": "database + openai",
                    "type": "objective",
                    "question": result.question,
                    "correct_answer": result.correct_answer,
                    "explanation": explanation
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"OpenAI API error during explanation: {str(e)}")

        # Not MCQ or no correct answer stored
        return {
            "source": "database",
            "type": "theory",
            "question": result.question,
            "answer": result.answer or "No stored answer available."
        }

    # Step 2: Use OpenAI for fallback
    prompt = (
        f"You are an educational assistant. Answer the following question based on the subject: {subject}.\n\n"
        f"Question: {question}"
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful educational assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.5
        )
        answer = response.choices[0].message.content.strip()
        return {
            "source": "openai",
            "type": "fallback",
            "question": question,
            "answer": answer
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

