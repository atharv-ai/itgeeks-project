from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from database import (
    connect_to_mongo,
    close_mongo_connection,
    get_database,
    get_bill_sessions_collection,
)
from schemas import Bill, ExtractResponse, CalculateRequest, CalculateResponse
from services.ai_extractor import extract_bill_from_images
from services.math_engine import calculate_bill_split
from routers import auth as auth_router_module
from dependencies import get_current_user_id


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
    version="0.2.0",
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

# ── Include routers ───────────────────────────────────────────────────────────
app.include_router(auth_router_module.router)


# ── Inline schemas (only for endpoints defined here) ─────────────────────────

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

class BillSummary(BaseModel):
    """Lightweight bill summary returned in the history list."""
    session_id: str
    session_name: str
    status: str
    created_at: str
    grand_total: Optional[float] = None
    member_count: Optional[int] = None


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    db = get_database()
    db_status = "disconnected"
    if db is not None:
        try:
            await db.command("ping")
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
    
    return HealthResponse(
        status="healthy",
        database=db_status,
        message="Bill Splitter Backend is running",
    )


# ── Sessions ──────────────────────────────────────────────────────────────────

@app.post(
    "/session",
    response_model=CreateSessionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Sessions"],
)
async def create_session(
    request: Optional[CreateSessionRequest] = None,
    current_user_id: str = Depends(get_current_user_id),
):
    """Create a named session. Requires authentication."""
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
        "user_id": current_user_id,
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


# ── Extraction ────────────────────────────────────────────────────────────────

@app.post(
    "/api/extract",
    response_model=ExtractResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Extraction"],
    summary="Extract receipt data from multiple images and create session",
)
async def extract_receipt(
    files: List[UploadFile] = File(..., description="One or more receipt images/photos to extract"),
    session_name: Optional[str] = Form(None, description="Optional name for this bill splitting session"),
    current_user_id: str = Depends(get_current_user_id),
):
    """Extract bill data from uploaded images. Requires authentication."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded. Please provide at least one receipt image.",
        )

    collection = get_bill_sessions_collection()
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database collection not available",
        )

    # Read uploaded file contents and collect MIME types
    image_bytes_list: List[bytes] = []
    mime_types: List[str] = []
    for file in files:
        content = await file.read()
        if content:
            image_bytes_list.append(content)
            mime_types.append(file.content_type or "image/jpeg")

    if not image_bytes_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file(s) are empty. Please provide valid image files.",
        )

    try:
        extracted_data = extract_bill_from_images(image_bytes_list, mime_types=mime_types)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI extraction failed: {str(e)}",
        )

    now = datetime.now(timezone.utc).isoformat()
    doc_name = session_name if session_name else f"Receipt {now}"

    session_doc = {
        "user_id": current_user_id,          # ← tied to authenticated user
        "session_name": doc_name,
        "status": "extracted",
        "created_at": now,
        "updated_at": now,
        "raw_extracted": extracted_data,
        "items": extracted_data.get("items", []),
        "subtotal": extracted_data.get("subtotal", 0.0),
        "taxes": extracted_data.get("taxes", 0.0),
        "service_charge": extracted_data.get("service_charge", 0.0),
        "discounts": extracted_data.get("discounts", 0.0),
        "total": extracted_data.get("total", 0.0),
        "overall_confidence": extracted_data.get("overall_confidence", 1.0),
        "people": [],
        "breakdown": None,
    }

    result = await collection.insert_one(session_doc)
    session_id = str(result.inserted_id)

    return ExtractResponse(
        session_id=session_id,
        status="extracted",
        created_at=now,
        extracted_data=Bill.model_validate(extracted_data),
    )


# ── Calculation (stateless — no auth required) ────────────────────────────────

@app.post(
    "/api/calculate",
    response_model=CalculateResponse,
    status_code=status.HTTP_200_OK,
    tags=["Calculation"],
    summary="Calculate proportional bill split among members",
)
async def calculate_split(request: CalculateRequest):
    """Pure math endpoint — no authentication required."""
    try:
        result = calculate_bill_split(
            bill=request.bill,
            members=request.members,
            item_assignments=request.item_assignments,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation error: {str(e)}",
        )

    # If session_id is provided, persist calculation result
    if request.session_id:
        collection = get_bill_sessions_collection()
        if collection is not None:
            try:
                from bson import ObjectId
                now = datetime.now(timezone.utc).isoformat()
                await collection.update_one(
                    {"_id": ObjectId(request.session_id)},
                    {
                        "$set": {
                            "people": request.members,
                            "item_assignments": request.item_assignments,
                            "breakdown": result["breakdown"],
                            "grand_total": result["grand_total"],
                            "status": "calculated",
                            "updated_at": now,
                        }
                    },
                )
            except Exception:
                pass  # Non-fatal — calculation result is still returned

    return CalculateResponse(
        session_id=request.session_id,
        breakdown=result["breakdown"],
        total_subtotal=result["total_subtotal"],
        total_taxes=result["total_taxes"],
        total_service_charge=result["total_service_charge"],
        total_discounts=result["total_discounts"],
        grand_total=result["grand_total"],
    )


# ── Bill history (authenticated) ──────────────────────────────────────────────

@app.get(
    "/api/bills/history",
    response_model=List[BillSummary],
    tags=["History"],
    summary="Get all past bills for the authenticated user",
)
async def get_bill_history(
    current_user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """
    Returns up to `limit` bill sessions belonging to the authenticated user,
    sorted newest-first.
    """
    collection = get_bill_sessions_collection()
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database collection not available",
        )

    cursor = (
        collection
        .find({"user_id": current_user_id}, {"raw_extracted": 0})  # exclude raw blob
        .sort("created_at", -1)
        .limit(limit)
    )

    sessions = []
    async for doc in cursor:
        breakdown = doc.get("breakdown") or []
        sessions.append(
            BillSummary(
                session_id=str(doc["_id"]),
                session_name=doc.get("session_name", "Untitled Session"),
                status=doc.get("status", "unknown"),
                created_at=doc.get("created_at", ""),
                grand_total=doc.get("grand_total"),
                member_count=len(breakdown) if breakdown else None,
            )
        )

    return sessions


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
