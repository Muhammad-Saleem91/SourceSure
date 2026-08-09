"""
Sourcing Case schemas — create, read, and analysis snapshot.

A SourcingCase is the top-level aggregate root.  CaseAnalysis is the
"read model" consumed by the frontend dashboard to show readiness flags,
warnings, and progress through the evaluation pipeline.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import CaseStatus


# ═══════════════════════════════════════════════════════════════════════════
# Request Schemas (inputs)
# ═══════════════════════════════════════════════════════════════════════════


class CaseCreate(BaseModel):
    """Payload for POST /cases — minimum viable fields to start a case."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Descriptive name for this sourcing evaluation.",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Optional context about the procurement goal.",
    )
    evaluation_date: Optional[date] = Field(
        default=None,
        description="Date against which certificate validity is checked.",
    )


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class CaseResponse(BaseModel):
    """Standard representation of a sourcing case returned by the API."""
    id: str
    name: str
    description: Optional[str] = None
    evaluation_date: Optional[date] = None
    status: CaseStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════════
# Analysis Read Model (Module 5.2 — wired in Phase 5, shape defined now)
# ═══════════════════════════════════════════════════════════════════════════


class SupplierSnapshot(BaseModel):
    """Lightweight supplier summary embedded inside CaseAnalysis."""
    id: str
    name: str
    status: str
    document_count: int = 0
    has_evidence: bool = False


class CaseAnalysis(BaseModel):
    """
    Aggregate read model for GET /cases/{id}/analysis.

    Provides the frontend with everything it needs to render the case
    dashboard in a single round-trip: supplier states, readiness flags,
    and actionable warnings.
    """
    case: CaseResponse
    suppliers: List[SupplierSnapshot] = Field(default_factory=list)

    # --- Pipeline readiness flags -------------------------------------------
    eligibility_ready: bool = Field(
        default=False,
        description="True if eligibility has been run for this case.",
    )
    ranking_ready: bool = Field(
        default=False,
        description="True if eligibility is done AND at least one PASS supplier exists.",
    )

    # --- Warnings for the user -----------------------------------------------
    warnings: List[str] = Field(
        default_factory=list,
        description="Human-readable alerts (e.g. REVIEW suppliers, missing evidence).",
    )

    active_scenario_id: Optional[str] = Field(
        default=None,
        description="ID of the most recent ranking scenario, if any.",
    )
