import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base project directory (3 levels up from this file)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

# Folder for uploaded lesson PDFs
PDF_FOLDER = os.path.abspath(os.getenv("PDF_FOLDER", os.path.join(BASE_DIR, "backend", "data", "lesson_pdfs")))

# Folder where ChromaDB stores vector data
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", os.path.join(BASE_DIR, "backend", "app", "chroma_db"))

# Create directories if they don’t exist
os.makedirs(PDF_FOLDER, exist_ok=True)
os.makedirs(CHROMA_DB_DIR, exist_ok=True)

# Embedding model (HuggingFace)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-base-en-v1.5")

# LLM providers
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
TOGETHER_MODEL = os.getenv("TOGETHER_MODEL", "meta-llama/Llama-3-8B-Instruct")

# Fallback options if Ollama fails (booleans)
USE_OPENAI_IF_OLLAMA_FAILS = os.getenv("USE_OPENAI_IF_OLLAMA_FAILS", "false").lower() == "true"
USE_TOGETHER_IF_OLLAMA_FAILS = os.getenv("USE_TOGETHER_IF_OLLAMA_FAILS", "false").lower() == "true"
