import os
import certifi
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
    users: Any = None


db_instance = MongoDB()


async def connect_to_mongo():
    client_kwargs: dict[str, Any] = {}
    # Use certifi CA bundle when connecting to MongoDB Atlas (srv) or when TLS/SSL is explicitly requested
    if "mongodb+srv" in MONGODB_URL or "tls=true" in MONGODB_URL.lower() or "ssl=true" in MONGODB_URL.lower():
        client_kwargs["tlsCAFile"] = certifi.where()

    db_instance.client = AsyncIOMotorClient(MONGODB_URL, **client_kwargs)
    db_instance.db = db_instance.client[DATABASE_NAME]
    db_instance.bill_sessions = db_instance.db["bill_sessions"]
    db_instance.users = db_instance.db["users"]

    # Ensure unique index on email for users collection
    await db_instance.users.create_index("email", unique=True)

    print(f"Connected to MongoDB at {MONGODB_URL}, database: {DATABASE_NAME}")


async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed")


def get_database():
    return db_instance.db


def get_bill_sessions_collection():
    return db_instance.bill_sessions


def get_users_collection():
    return db_instance.users
