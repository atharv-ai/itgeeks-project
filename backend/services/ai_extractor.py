import os
import json
from pathlib import Path
from typing import List, Optional, Union, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
from schemas import Bill

# Load .env from backend directory or project root
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")
load_dotenv()

def detect_mime_type(image_bytes: bytes) -> str:
    """Infer image or document MIME type from magic header bytes."""
    if image_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    elif image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif image_bytes.startswith(b"RIFF") and len(image_bytes) >= 12 and image_bytes[8:12] == b"WEBP":
        return "image/webp"
    elif image_bytes.startswith(b"%PDF"):
        return "application/pdf"
    elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
        return "image/gif"
    return "image/jpeg"

def extract_bill_from_images(
    image_bytes_list: List[bytes],
    mime_types: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Extracts bill data from a list of image bytes using Gemini 3.8 Flash.
    Enforces structured JSON output conforming to the Bill schema.

    :param image_bytes_list: List of raw image/document bytes
    :param mime_types: Optional list of MIME types corresponding to each image
    :return: Parsed JSON dictionary matching the Bill schema
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment or .env file")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        model_name="gemini-3.8-flash",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=Bill,
        ),
    )

    prompt = (
        "You are an expert OCR and receipt parsing specialist. "
        "Carefully analyze the provided receipt/bill image(s) and extract all line items, "
        "subtotal, taxes, service charges, discounts, and total. "
        "If multiple images are provided, combine them into a single consolidated bill without duplicating items. "
        "Ensure every item has its detected name, quantity (defaults to 1.0 if not specified), "
        "total price for that item line, and a confidence score between 0.0 and 1.0. "
        "Provide an overall confidence score for the entire receipt extraction."
    )

    contents: List[Any] = [prompt]

    for idx, img_bytes in enumerate(image_bytes_list):
        if not img_bytes:
            continue
        mime_type = (
            mime_types[idx]
            if mime_types and idx < len(mime_types) and mime_types[idx]
            else detect_mime_type(img_bytes)
        )
        contents.append({
            "mime_type": mime_type,
            "data": img_bytes,
        })

    response = model.generate_content(contents)
    
    if not response.text:
        raise RuntimeError("Gemini model returned an empty response.")

    # Parse and validate through Pydantic to ensure strict compliance
    parsed_json = json.loads(response.text)
    validated_bill = Bill.model_validate(parsed_json)
    return validated_bill.model_dump()
