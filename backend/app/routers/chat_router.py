from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import logging


# Internal chatbot logic
from ..rag_chatbot.chat import (
    get_chat_engine,
    generate_audio,
    generate_image,
    should_generate_image,
)

# llama-index message format
from llama_index.core.chat_engine.types import ChatMessage as LlamaChatMessage

router = APIRouter(prefix="/chat", tags=["Chatbot"])

# Client -> Server message schema
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

# Client request payload
class ChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []

# Server response payload
class ChatResponse(BaseModel):
    answer: str
    audio_base64: Optional[str] = None
    image_url: Optional[str] = None

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """
    Handles a conversational chat request using RAG (Retrieval-Augmented Generation).
    It supports text answers, audio output, and optional image generation.
    """
    try:
        # Get singleton chat engine
        chat_engine = get_chat_engine()

        # Convert history to llama-index format
        chat_history = [
            LlamaChatMessage(role=msg.role, content=msg.content)
            for msg in payload.history
        ]

        latest_question = payload.question

        # Run blocking chat in background executor
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: chat_engine.chat(
                    message=latest_question,
                    chat_history=chat_history
                )
            ),
            timeout=300  # seconds
        )

        final_answer = response.response

        # Optional audio generation
        try:
            audio_base64 = await generate_audio(final_answer)
        except Exception as e:
            audio_base64 = None
            logging.warning(f"Audio generation failed: {e}")

        # Optional image generation
        image_url = None
        if should_generate_image(latest_question):
            try:
                image_url = generate_image(latest_question)
            except Exception as e:
                logging.warning(f"Image generation failed: {e}")

        return ChatResponse(
            answer=final_answer,
            audio_base64=audio_base64,
            image_url=image_url,
        )

    except asyncio.TimeoutError:
        logging.error("Chatbot timed out.")
        raise HTTPException(status_code=408, detail="⏱️ Model response timed out.")
    except Exception as e:
        logging.error(f"❌ Chatbot crashed: {e}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"❌ Server error while generating response: {str(e)}"
        )
