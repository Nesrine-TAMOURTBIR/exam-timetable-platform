from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router

app = FastAPI(title="Exam Optimization Platform")

# CORS (Allow Frontend)
import os
from dotenv import load_dotenv

load_dotenv()

# Get allowed origins from environment or use defaults
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
# Add Firebase hosting URLs if provided
firebase_url = os.getenv("FIREBASE_URL")
if firebase_url:
    allowed_origins.append(firebase_url)
    allowed_origins.append(f"https://{firebase_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "University Exam Optimization API"}
