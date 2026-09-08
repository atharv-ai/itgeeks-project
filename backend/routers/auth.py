"""
Auth router — POST /auth/register and POST /auth/login.
Uses the `bcrypt` package directly to avoid passlib compatibility issues
with Python 3.14's stricter bytes handling.
"""
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, status
from dotenv import load_dotenv
from pymongo.errors import DuplicateKeyError

from database import get_users_collection
from schemas import UserCreate, Token

# Load env (needed when this module is imported before main.py loads it)
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")
load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))

router = APIRouter(prefix="/auth", tags=["Auth"])


def _hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate):
    """Create a new user account and return a JWT access token."""
    collection = get_users_collection()
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    hashed = _hash_password(body.password)
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "email": body.email.lower().strip(),
        "hashed_password": hashed,
        "created_at": now,
    }

    try:
        result = await collection.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    token = _create_access_token(str(result.inserted_id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(body: UserCreate):
    """Verify credentials and return a JWT access token."""
    collection = get_users_collection()
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    user = await collection.find_one({"email": body.email.lower().strip()})
    if user is None or not _verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = _create_access_token(str(user["_id"]))
    return Token(access_token=token)
