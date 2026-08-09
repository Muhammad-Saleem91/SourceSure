"""
Application entrypoint.

Wires together settings, logging, CORS, the versioned API router, and
global exception handlers. Business logic never lives here — this file
is composition only (see Module 0.1 in implementation_plan.md).
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import RequestIDMiddleware, configure_logging
from app.db.session import Base, engine

settings = get_settings()
configure_logging(settings.APP_ENV)
logger = logging.getLogger("sourcesure")

app = FastAPI(
    title="SourceSure API",
    version="0.1.0",
    description="Screens, ranks, and explains supplier shortlisting for manufacturing sourcing decisions.",
)

# --- Middleware -----------------------------------------------------------
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global error handling -------------------------------------------------
register_exception_handlers(app)

# --- Routes -----------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def root_health() -> dict:
    """Unversioned liveness probe — kept separate from /api/v1 for infra checks."""
    return {"status": "ok", "version": "0.1.0"}


@app.on_event("startup")
def on_startup() -> None:
    """
    Create DB tables on boot.

    Phase 0 has no ORM models registered yet, so this is a safe no-op
    until `app/db/models.py` lands in Phase 1 — at that point importing
    the models module here (before create_all) is what registers them
    against `Base.metadata`.
    """
    try:
        from app.db import models  # noqa: F401  (registers models with Base.metadata, Phase 1+)
    except ImportError:
        logger.info("startup: app.db.models not present yet (expected pre-Phase 1)")

    Base.metadata.create_all(bind=engine)
    logger.info("startup: complete env=%s db=%s", settings.APP_ENV, settings.DATABASE_URL)
