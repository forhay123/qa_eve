import requests
import json
import re

def split_text_into_chunks(text, max_words=1500):
    """Split large text into manageable chunks based on word count."""
    words = text.split()
    chunks = [' '.join(words[i:i + max_words]) for i in range(0, len(words), max_words)]
    return chunks

def generate_questions_from_text(text_chunk: str, max_questions: 35, model: str = "llama3"):
    """Generate question-answer pairs from a single text chunk using Ollama."""
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
            json={"model": model, "prompt": prompt.strip(), "stream": False}
        )
        response.raise_for_status()
        output_text = response.json()["response"].strip()

        print("📦 Raw model output:\n", repr(output_text[:500]))  # Limit preview

        # Clean up: remove any markdown fences or unwanted content
        output_text = re.sub(r"```(?:json)?", "", output_text, flags=re.IGNORECASE).strip("` \n")

        # Extract JSON array manually
        match = re.search(r"\[\s*{.*?}\s*]", output_text, re.DOTALL)
        if not match:
            raise ValueError("No valid JSON array found in model output.")

        json_str = match.group()

        # Safely parse
        qa_pairs = json.loads(json_str)

        # Truncate to max_questions
        return qa_pairs[:max_questions]

    except Exception as e:
        print("❌ Generation failed:", e)
        return [{
            "question": "Error generating question",
            "answer": str(e)
        }]

def generate_questions_from_pdf_text(
    full_text: str,
    total_max_questions: int = 100,
    max_per_chunk: int = 15,
    model: str = "llama3"
):
    """Generate up to `total_max_questions` question-answer pairs from an entire document by splitting it into chunks."""
    chunks = split_text_into_chunks(full_text, max_words=1500)
    all_qa_pairs = []

    for i, chunk in enumerate(chunks):  # ✅ Added enumerate to get i
        remaining = total_max_questions - len(all_qa_pairs)
        if remaining <= 0:
            break

        questions_to_generate = min(max_per_chunk, remaining)

        qa_pairs = generate_questions_from_text(chunk, max_questions=questions_to_generate, model=model)

        print(f"Chunk {i+1}: Requested {questions_to_generate}, Generated {len(qa_pairs)} questions")

        # Filter valid entries
        qa_pairs = [
            qa for qa in qa_pairs
            if isinstance(qa, dict) and "question" in qa and "answer" in qa
        ]

        all_qa_pairs.extend(qa_pairs)

    print(f"✅ Total questions generated: {len(all_qa_pairs)}")
    return all_qa_pairs[:total_max_questions]
