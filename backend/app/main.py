"""
Juryline — FastAPI Application
Main entry point with CORS, health check, and router registration.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    # Startup
    settings = get_settings()
    logger.info(f"API starting in {settings.app_env} mode")
    logger.info(f"Supabase: {settings.supabase_url}")
    logger.info(f"Frontend: {settings.frontend_url}")
    yield
    # Shutdown
    logger.info("API shutting down")


app = FastAPI(
    title="Juryline API",
    description="Hackathon judging platform with dynamic forms",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
settings = get_settings()

# Build origins list from env variable + defaults
_default_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
]
_extra_origins = [
    o.strip() for o in settings.cors_origins.split(",") if o.strip()
] if settings.cors_origins else []
_all_origins = list(dict.fromkeys(_default_origins + _extra_origins))  # dedupe, preserve order

app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Headers & Compression ──
if settings.is_production:
    # Only allow requests from trusted hosts in production
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],  # Configure with your domains in production
    )

# Add gzip compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1000)


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
from app.routers import auth, profile, events, form_fields, criteria, judges, uploads, submissions, reviews, archestra, dashboard

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
app.include_router(dashboard.router, prefix="/api/v1")
