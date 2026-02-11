"""
Juryline — FastAPI Application
Main entry point with CORS, health check, and router registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    # Startup
    settings = get_settings()
    print(f"[Juryline] API starting in {settings.app_env} mode")
    print(f"[Juryline] Supabase: {settings.supabase_url}")
    print(f"[Juryline] Frontend: {settings.frontend_url}")
    yield
    # Shutdown
    print("[Juryline] API shutting down")


app = FastAPI(
    title="Juryline API",
    description="Hackathon judging platform with dynamic forms",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "juryline-api",
        "version": "0.1.0",
    }


@app.get("/api/v1/health")
async def api_health_check():
    return {
        "status": "healthy",
        "service": "juryline-api",
        "version": "0.1.0",
        "database": "supabase",
    }


# -- Routers --
from app.routers import auth, profile, events, form_fields, criteria, judges, uploads, submissions, reviews, archestra

app.include_router(auth.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(form_fields.router, prefix="/api/v1")
app.include_router(criteria.router, prefix="/api/v1")
app.include_router(judges.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(archestra.router, prefix="/api/v1")
