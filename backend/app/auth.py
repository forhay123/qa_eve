from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from . import models, database
from .dependencies import get_current_user
from .security import oauth2_scheme  # ✅ shared import

# Load environment variables from .env
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------- Password Utilities ----------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare plain password with hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)

# ---------------- Authentication Logic ----------------

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user by verifying their password."""
    user = db.query(models.User).filter(models.User.username == username).first()
    if user and verify_password(password, user.hashed_password):
        return user
    return None

# ---------------- JWT Token Creation ----------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    to_encode = data.copy()
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
    })

    # Ensure standard claims
    to_encode.setdefault("sub", data.get("sub"))       # e.g., username
    to_encode.setdefault("user_id", data.get("user_id"))
    to_encode.setdefault("role", data.get("role"))

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---------------- Get Role from Token (Optional Utility) ----------------

def get_user_role(token: str = Depends(oauth2_scheme)):
    """Get role from JWT token without full user lookup."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("role", "student")  # Default to student
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate role",
            headers={"WWW-Authenticate": "Bearer"},
        )
