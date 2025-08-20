import fitz  # PyMuPDF
import json
import re
import os
import logging
import openai
from sqlalchemy.orm import Session
from openai import OpenAIError
from app import models
from app.config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

# ------------------ PDF Text Extraction ------------------

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    return " ".join(page.get_text() for page in doc).strip()

def chunk_text(text: str, max_tokens: int = 700) -> list[str]:
    sentences = text.split('.')
    chunks, current = [], ''

    for sentence in sentences:
        sentence = sentence.strip()
        if len(current) + len(sentence) < max_tokens:
            current += sentence + '. '
        else:
            chunks.append(current.strip())
            current = sentence + '. '

    if current:
        chunks.append(current.strip())

    return chunks

# ------------------ Prompt Builders ------------------

def build_prompt_for_theory_questions(text_chunk: str) -> str:
    return f"""
You are an expert educator.

Based strictly on the following lesson content, generate as many THEORY (descriptive) questions as possible.

Each question MUST be paired with a clear and complete answer suitable for grading.

You must only use the content below to generate the questions. Do not invent or infer beyond what is explicitly written.

Only return a JSON array in this exact format:

[
  {{
    "question": "Explain Newton's First Law of Motion.",
    "answer": "Newton's First Law states that an object will remain at rest or move in a straight line at constant speed unless acted upon by a force."
  }}
]

Do not include markdown, notes, or explanations. Output ONLY valid JSON.

Lesson Content:
{text_chunk}
"""

def build_prompt_for_objective_questions(text_chunk: str) -> str:
    return f"""
You are an expert educational content creator.

Generate as many OBJECTIVE multiple choice questions as possible based strictly on the content below.

You must only use the content below to generate the questions. Do not invent or infer beyond what is explicitly written.

Return only a JSON array in this format:
[
  {{
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "a" | "b" | "c" | "d",
    "answer": "Short explanation or full correct answer text"
  }}
]

Only return valid JSON. No markdown or comments.

Content:
{text_chunk}
"""

# ------------------ Response Parser ------------------

def parse_json_response(text: str) -> list[dict]:
    try:
        text = text.strip()
        match = re.search(r"\[\s*{.*?}\s*]", text, re.DOTALL)
        json_str = match.group(0) if match else text
        data = json.loads(json_str)
        return data if isinstance(data, list) else []
    except Exception as e:
        logging.error("❌ JSON parsing error: %s", e)
        logging.debug("⚠️ Raw response: %s", text)
        return []

# ------------------ Question Generation ------------------

def chat_with_openai(prompt: str) -> str:
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except OpenAIError as e:
        logging.exception("❌ OpenAI API error")
        raise

def generate_questions_by_type(
    pdf_path: str,
    topic_id: int,
    db: Session,
    qtype: str,
):
    assert qtype in ("objective", "theory"), "Invalid question type"

    text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(text)
    saved = []

    print(f"📄 Extracted {len(text)} characters across {len(chunks)} chunks.")

    for chunk in chunks:
        try:
            if qtype == "objective":
                prompt = build_prompt_for_objective_questions(chunk)
            else:
                prompt = build_prompt_for_theory_questions(chunk)

            raw_output = chat_with_openai(prompt)
            print(f"\n🧠 {qtype.upper()} Raw:\n{raw_output}")
            questions = parse_json_response(raw_output)

            for q in questions:
                if not q.get("question") or not isinstance(q["question"], str):
                    continue

                question_text = q["question"].strip()
                answer_text = q.get("answer", "").strip()

                options = {
                    "a": q.get("option_a", "").strip(),
                    "b": q.get("option_b", "").strip(),
                    "c": q.get("option_c", "").strip(),
                    "d": q.get("option_d", "").strip(),
                }
                correct = q.get("correct_answer", "").strip().lower()

                all_options_filled = all(options.values())
                valid_correct = correct in options and options[correct]

                # 🧠 Initial assignment based on qtype
                question_type = qtype

                # ⚠️ Safety override: theory prompt returned options
                if qtype == "theory" and all_options_filled and valid_correct:
                    logging.warning(f"⚠️ Theory question has options. Forcing to objective: {question_text[:60]}...")
                    question_type = "objective"

                # ❌ Skip invalid structures
                if question_type == "objective" and not (all_options_filled and valid_correct):
                    logging.warning(f"❌ Skipping invalid objective: {question_text[:60]}...")
                    continue

                if question_type == "theory" and not answer_text:
                    logging.warning(f"❌ Skipping theory without answer: {question_text[:60]}...")
                    continue

                if question_type == "theory":
                    correct = answer_text

                db_question = models.TopicQuestion(
                    topic_id=topic_id,
                    question=question_text,
                    answer=answer_text,
                    correct_answer=correct,
                    option_a=options["a"] if question_type == "objective" else None,
                    option_b=options["b"] if question_type == "objective" else None,
                    option_c=options["c"] if question_type == "objective" else None,
                    option_d=options["d"] if question_type == "objective" else None,
                    question_type=question_type,
                )

                db.add(db_question)
                saved.append(db_question)
                print(f"✅ Saved {question_type.upper()} - {question_text[:60]}...")

        except Exception as e:
            logging.exception(f"❌ Error generating {qtype} questions")

    db.commit()
    return saved

def generate_questions_from_pdf(
    pdf_path: str,
    topic_id: int,
    db: Session,
):
    objective = generate_questions_by_type(
        pdf_path=pdf_path,
        topic_id=topic_id,
        db=db,
        qtype="objective"
    )

    theory = generate_questions_by_type(
        pdf_path=pdf_path,
        topic_id=topic_id,
        db=db,
        qtype="theory"
    )

    print(f"🎉 Done! Saved Objective: {len(objective)} | Theory: {len(theory)}")

    # ❌ Don't delete PDFs from lesson_pdfs
    # if "uploaded_pdfs" in pdf_path or "tmp" in pdf_path:
    #     if os.path.exists(pdf_path):
    #         os.remove(pdf_path)

    return objective + theory
