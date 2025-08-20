# app/services/answer_checker.py

from sentence_transformers import SentenceTransformer, util
from pathlib import Path

model_path = Path(__file__).resolve().parent.parent / "sentence_model"
model = SentenceTransformer(str(model_path))

SIMILARITY_THRESHOLD = 0.7  # Fully correct if ≥ 0.7
ALMOST_THRESHOLD = 0.5      # Considered "almost correct" if between 0.5 and 0.7

def check_answer(user_answer: str, correct_answer: str):
    user_answer = user_answer.strip().lower()
    correct_answer = correct_answer.strip().lower()

    if not user_answer:
        return False, "Answer cannot be empty.", 0.0

    # Embedding similarity
    embeddings = model.encode([user_answer, correct_answer], convert_to_tensor=True)
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

    # Categorize by threshold
    if similarity >= SIMILARITY_THRESHOLD:
        return True, None, similarity
    elif similarity >= ALMOST_THRESHOLD:
        return False, f"Almost correct. Correct answer: {correct_answer}", similarity
    else:
        return False, f"Incorrect. Correct answer: {correct_answer}", similarity
