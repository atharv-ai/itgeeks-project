from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from database import (
    connect_to_mongo,
    close_mongo_connection,
    get_database,
    get_bill_sessions_collection,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: establish Mongo connection
    await connect_to_mongo()
    yield
    # Shutdown: close Mongo connection
    await close_mongo_connection()

app = FastAPI(
    title="Bill Splitter API",
    description="Backend API for 'Split the Bill From a Photograph'",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware to accept all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    database: str
    message: str

class CreateSessionRequest(BaseModel):
    session_name: Optional[str] = Field(default="Untitled Session", description="Optional label for this bill splitting session")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary metadata")

class CreateSessionResponse(BaseModel):
    session_id: str
    status: str
    created_at: str
    session_name: str

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    db = get_database()
    db_status = "disconnected"
    if db is not None:
        try:
            # Ping database to confirm connectivity
            await db.command("ping")
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
    
    return HealthResponse(
        status="healthy",
        database=db_status,
        message="Bill Splitter Backend is running",
    )

@app.post("/session", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED, tags=["Sessions"])
async def create_session(request: Optional[CreateSessionRequest] = None):
    collection = get_bill_sessions_collection()
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database collection not available",
        )
    
    session_name = request.session_name if request and request.session_name else "Untitled Session"
    metadata = request.metadata if request and request.metadata else {}
    now = datetime.now(timezone.utc).isoformat()
    
    dummy_doc = {
        "session_name": session_name,
        "metadata": metadata,
        "status": "created",
        "created_at": now,
        "items": [],
        "people": [],
        "breakdown": None,
    }
    
    result = await collection.insert_one(dummy_doc)
    
    return CreateSessionResponse(
        session_id=str(result.inserted_id),
        status="created",
        created_at=now,
        session_name=session_name,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
