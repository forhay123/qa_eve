from transformers import pipeline
import re

# Load summarizer and question generation model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
qg_model = pipeline("text2text-generation", model="iarfmoose/t5-base-question-generator")
qa_model = pipeline("question-answering")

def highlight_answers(text, answers):
    for ans in sorted(answers, key=len, reverse=True):
        pattern = re.escape(ans)
        text = re.sub(pattern, f"<hl> {ans} <hl>", text, count=1)
    return text

def generate_smart_qas(text, max_questions=5):
    try:
        # Step 1: Summarize text
        summary = summarizer(text, max_length=300, min_length=100, do_sample=False)[0]['summary_text']

        # Step 2: Extract potential answers using NER/keywords
        from transformers import pipeline as pl
        ner = pl("ner", grouped_entities=True)
        entities = list(set([e['word'] for e in ner(summary) if e['entity_group'] in ['PER', 'LOC', 'ORG', 'MISC']]))
        if not entities:
            entities = summary.split()[:max_questions]

        results = []
        for entity in entities[:max_questions]:
            highlighted = highlight_answers(summary, [entity])
            prompt = f"generate question: {highlighted}"
            question = qg_model(prompt, max_new_tokens=64, do_sample=False)[0]['generated_text'].strip()

            if not question.lower().startswith("what") and "?" not in question:
                continue

            answer = qa_model(question=question, context=summary)['answer'].strip()

            # Basic answer quality filter
            if len(answer) < 2 or answer.lower() in {"the", "a", "of", "to", "and", "true"}:
                continue

            results.append({
                "question": question,
                "answer": answer,
                "context": summary
            })

        return results[:max_questions] or [{"question": "No good questions generated", "answer": "", "context": summary}]

    except Exception as e:
        return [{"question": "Error generating questions", "answer": str(e), "context": ""}]
