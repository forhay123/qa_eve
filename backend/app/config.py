# backend/app/config.py

import os
from dotenv import load_dotenv
from pathlib import Path


load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60
BASE_DIR = Path(__file__).resolve().parent.parent
PROFILE_IMAGE_DIR = BASE_DIR / "static" / "profiles"

# ✅ OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
