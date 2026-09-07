import os
from pathlib import Path
from typing import Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env from backend directory or project root
backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir / ".env")
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hackathon_db")

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    bill_sessions: Any = None

db_instance = MongoDB()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(MONGODB_URL)
    db_instance.db = db_instance.client[DATABASE_NAME]
    db_instance.bill_sessions = db_instance.db["bill_sessions"]
    print(f"Connected to MongoDB at {MONGODB_URL}, database: {DATABASE_NAME}")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed")

def get_database():
    return db_instance.db

def get_bill_sessions_collection():
    return db_instance.bill_sessions
