"""
Single aggregation point for every v1 route module.

Phase 1+ adds one `include_router` line per new module (cases, suppliers,
requirements, documents, evidence, eligibility, ranking, decisions) —
`app/main.py` never imports individual route modules directly, only this
`api_router`, so route wiring stays in one place.
"""

from fastapi import APIRouter

from app.api.v1 import health

api_router = APIRouter()

api_router.include_router(health.router)

# --- Phase 1 additions ---------------------------------------------------
from app.api.v1 import cases, requirements, suppliers, documents, evidence
from app.api.v1 import eligibility, ranking, decisions

api_router.include_router(cases.router)
api_router.include_router(requirements.router)
api_router.include_router(suppliers.router)
api_router.include_router(documents.router)
api_router.include_router(evidence.router)
api_router.include_router(eligibility.router)
api_router.include_router(ranking.router)
api_router.include_router(decisions.router)
