import os
import re
import uuid
import base64
import logging
import tempfile
import chromadb
import openai
import edge_tts

from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    Settings,
)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.openai import OpenAI
from llama_index.core.chat_engine.condense_question import CondenseQuestionChatEngine
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.response_synthesizers import get_response_synthesizer

from .config import (
    PDF_FOLDER,
    CHROMA_DB_DIR,
    EMBEDDING_MODEL,
    OPENAI_API_KEY,
    OPENAI_MODEL,
)
from app.rag_chatbot.db import get_topic_name_by_metadata, get_all_subjects_from_db

# ──────────────────────────────────────────────────────────────
# 🔁 Global cache
_index = None
_chat_engine = None

# ──────────────────────────────────────────────────────────────
# 🧠 Chat Engine (with RAG)
def get_chat_engine():
    global _index, _chat_engine

    if _chat_engine:
        return _chat_engine

    os.makedirs(PDF_FOLDER, exist_ok=True)
    os.makedirs(CHROMA_DB_DIR, exist_ok=True)

    # 🔎 Setup ChromaDB + embeddings
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    chroma_collection = chroma_client.get_or_create_collection("lesson_chunks")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

    # 🧠 Embedding model
    embed_model = HuggingFaceEmbedding(model_name=EMBEDDING_MODEL)

    # 🧱 Storage + Index
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    _index = VectorStoreIndex.from_vector_store(
        vector_store=vector_store,
        storage_context=storage_context,
        embed_model=embed_model,
    )

    # 🔗 Connect LLM
    llm = OpenAI(api_key=OPENAI_API_KEY, model=OPENAI_MODEL)
    Settings.llm = llm
    Settings.embed_model = embed_model

    # 🧠 RAG setup: Retriever + Synthesizer
    retriever = _index.as_retriever(similarity_top_k=6)
    response_synth = get_response_synthesizer(response_mode="compact", llm=llm)
    query_engine = RetrieverQueryEngine(
        retriever=retriever,
        response_synthesizer=response_synth,
    )

    # 🤖 Chat engine with history handling
    _chat_engine = CondenseQuestionChatEngine.from_defaults(
        query_engine=query_engine,
        llm=llm,
        verbose=True,
    )

    return _chat_engine

# ──────────────────────────────────────────────────────────────
# 📚 Topic Metadata Detection

def detect_topic_metadata_question(query: str) -> str | None:
    if "week" in query.lower() and "topic" in query.lower():
        match = re.search(r"week (\d+)", query.lower())
        level_match = re.search(r"(ss[1-3]|jss[1-3])", query.lower())

        subjects = get_all_subjects_from_db()  # From DB, returns List[str]
        subject = None
        for s in subjects:
            if s.lower() in query.lower():
                subject = s
                break

        if match and level_match and subject:
            week = int(match.group(1))
            level = level_match.group(1).upper()
            subject = subject.capitalize()

            topic = get_topic_name_by_metadata(level=level, subject=subject, week=week)
            if topic:
                return f"The Week {week} topic for {level} {subject} is '{topic}'."
    return None

# ──────────────────────────────────────────────────────────────
# 🎨 Image Generation
def should_generate_image(question: str) -> bool:
    keywords = ["diagram", "picture", "image", "draw", "sketch", "illustrate"]
    return any(word in question.lower() for word in keywords)

def generate_image(prompt: str) -> str:
    try:
        openai.api_key = OPENAI_API_KEY
        response = openai.Image.create(prompt=prompt, n=1, size="512x512")
        return response['data'][0]['url']
    except Exception:
        logging.error("Image generation failed:", exc_info=True)
        return ""

# 🔊 Audio Generation
async def generate_audio(text: str) -> str:
    try:
        filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(tempfile.gettempdir(), filename)

        communicate = edge_tts.Communicate(text, voice="en-US-AriaNeural")
        await communicate.save(output_path)

        if not os.path.exists(output_path):
            raise FileNotFoundError(f"Audio file not found: {output_path}")

        with open(output_path, "rb") as f:
            audio_data = f.read()

        encoded_audio = base64.b64encode(audio_data).decode("utf-8")
        os.remove(output_path)
        return encoded_audio

    except Exception:
        logging.error("Audio generation failed:", exc_info=True)
        return ""
