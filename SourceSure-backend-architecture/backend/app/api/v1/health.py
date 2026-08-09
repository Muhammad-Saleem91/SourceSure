"""Liveness endpoint — no DB, no auth, used by the Phase 0 gate check."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def get_health() -> dict:
    return {"status": "ok", "version": "0.1.0"}
