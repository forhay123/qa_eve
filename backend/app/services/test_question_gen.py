from qa_generator import generate_questions_from_text

sample_text = """The Rise and Fall of a Happy Marriage. Once upon a time..."""
questions = generate_questions_from_text(sample_text, max_questions=5, use_sampling=False)

print("\n📋 Generated Questions:")
for q in questions:
    print(f"Q: {q['question']}\nA: {q['answer']}\n")
