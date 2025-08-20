# security.py
from fastapi.security import OAuth2PasswordBearer

# Unified OAuth2 scheme definition
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

