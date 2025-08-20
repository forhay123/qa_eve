# services/grading.py

from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def grade_theory_answer(model_answer: str, student_answer: str) -> float:
    prompt = f"""
You are a teacher. Grade the student's answer based on the model answer.

Model Answer:
{model_answer}

Student Answer:
{student_answer}

Score between 0 and 10. Return only the number.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You're a strict but fair grader."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=10,
        )
        score_text = response.choices[0].message.content.strip()
        return min(max(float(score_text), 0), 10)  # Clamp between 0 and 10
    except Exception as e:
        print("Grading error:", e)
        return 0.0
