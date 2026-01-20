from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router

app = FastAPI(title="Exam Optimization Platform", redirect_slashes=False)

# CORS (Allow Frontend)
import os
from dotenv import load_dotenv

load_dotenv()

# CORS Configuration
# For production, you should restrict to specific origins
# For now, allow all origins to fix CORS issues quickly
allowed_origins_list = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins_list = [origin.strip() for origin in allowed_origins_list if origin.strip()]

# Add Firebase URLs
firebase_urls = [
    "https://exam-timetemplate.web.app",
    "https://exam-timetemplate.firebaseapp.com",
    "http://localhost:5173",
    "http://localhost:3000",
]
allowed_origins_list.extend(firebase_urls)

# Add Firebase URL from environment if provided
firebase_url = os.getenv("FIREBASE_URL")
if firebase_url:
    allowed_origins_list.append(firebase_url)
    if not firebase_url.startswith("https://"):
        allowed_origins_list.append(f"https://{firebase_url}")

# Global exception handler middleware to ensure CORS headers on all responses
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import traceback

class CatchAllExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin", "*")
        try:
            response = await call_next(request)
            # Ensure CORS headers are always present
            if "access-control-allow-origin" not in response.headers:
                response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "*"
            return response
        except Exception as e:
            print(f"[BACKEND ERROR] Unhandled exception: {e}")
            traceback.print_exc()
            # Return JSON error response with CORS headers
            return JSONResponse(
                status_code=500,
                content={"detail": str(e)},
                headers={
                    "Access-Control-Allow-Origin": origin if origin else "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                }
            )

# Logging Middleware to debug Render requests
@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    print(f"[BACKEND DEBUG] Inbound Request: {method} {path} | Origin: {origin}")
    response = await call_next(request)
    print(f"[BACKEND DEBUG] Outbound Response Status: {response.status_code}")
    return response

# FIX: Use Wildcard '*' but DISABLE credentials to be spec-compliant.
# Since we use Bearer Tokens (Headers) and not Cookies, this is safe and easiest.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add exception middleware AFTER CORS (middleware order is LIFO, so this runs first)
app.add_middleware(CatchAllExceptionMiddleware)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "University Exam Optimization API"}
# Redeploy Trigger
