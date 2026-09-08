"""
FastAPI dependencies for JWT authentication.
"""
import os
from pathlib import Path

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

# Load env so this module can be imported standalone (e.g. in tests)
backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir / ".env")
load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# tokenUrl points to the login endpoint; used only for OpenAPI "Authorize" UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials. Please log in.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """
    Extract and validate the JWT from the Authorization: Bearer header.
    Returns the user_id (str) on success; raises 401 on failure.
    """
    if token is None:
        raise _CREDENTIALS_EXCEPTION
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise _CREDENTIALS_EXCEPTION
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise _CREDENTIALS_EXCEPTION
