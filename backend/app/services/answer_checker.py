# app/services/answer_checker.py

import os
import requests

SIMILARITY_THRESHOLD = 0.7  # Fully correct if ≥ 0.7
ALMOST_THRESHOLD = 0.5      # Considered "almost correct" if between 0.5 and 0.7

# Choose embedding model (can be OpenAI, Together, or HuggingFace Inference API)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def get_embedding(text: str):
    """
    Get embedding via OpenAI API (or any other API you configure).
    """
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    response = requests.post(
        "https://api.openai.com/v1/embeddings",
        headers=headers,
        json={"input": text, "model": EMBEDDING_MODEL},
        timeout=10
    )
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]

def cosine_similarity(vec1, vec2):
    import numpy as np
    vec1, vec2 = np.array(vec1), np.array(vec2)
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

def check_answer(user_answer: str, correct_answer: str):
    user_answer = user_answer.strip().lower()
    correct_answer = correct_answer.strip().lower()

    if not user_answer:
        return False, "Answer cannot be empty.", 0.0

    # Get embeddings via API
    try:
        user_vec = get_embedding(user_answer)
        correct_vec = get_embedding(correct_answer)
        similarity = cosine_similarity(user_vec, correct_vec)
    except Exception as e:
        return False, f"Error checking answer: {str(e)}", 0.0

    # Categorize by threshold
    if similarity >= SIMILARITY_THRESHOLD:
        return True, None, similarity
    elif similarity >= ALMOST_THRESHOLD:
        return False, f"Almost correct. Correct answer: {correct_answer}", similarity
    else:
        return False, f"Incorrect. Correct answer: {correct_answer}", similarity
