"""
Eligibility schemas — run requests, check results, and the eligibility matrix.

Eligibility is evaluated by deterministic pure functions (Phase 3, Module 3.1)
— never by the LLM.  The schemas here define how clients trigger eligibility
runs and how results are returned in the matrix format consumed by the
frontend grid component.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import CheckStatus, ReasonCode


# ═══════════════════════════════════════════════════════════════════════════
# Request Schemas (inputs)
# ═══════════════════════════════════════════════════════════════════════════


class EligibilityRunRequest(BaseModel):
    """
    Payload for POST /cases/{case_id}/eligibility-runs.

    If supplier_ids is omitted, eligibility is evaluated for ALL suppliers
    in the case.  This allows re-running eligibility for a subset after
    new evidence is uploaded.
    """
    supplier_ids: Optional[List[str]] = Field(
        default=None,
        description="Specific suppliers to evaluate. Omit to evaluate all.",
    )


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class EligibilityRunResponse(BaseModel):
    """Summary returned after an eligibility run completes."""
    case_id: str
    suppliers_evaluated: int = Field(..., ge=0)
    results: Dict[str, int] = Field(
        ...,
        description="Counts by status: {'PASS': n, 'FAIL': n, 'REVIEW': n}",
    )


class EligibilityCheckResponse(BaseModel):
    """
    Result of evaluating a single mandatory requirement for one supplier.

    Contains the observed value, the reason code explaining the outcome,
    and the evidence IDs that were consulted (traceability mandate).
    """
    id: str
    case_id: str
    supplier_id: str
    requirement_id: str
    status: CheckStatus
    observed_value: Optional[Any] = None
    observed_unit: Optional[str] = None
    reason_code: ReasonCode
    explanation: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)
    rule_version: str
    evaluated_at: datetime

    model_config = {"from_attributes": True}


class SupplierEligibilitySummary(BaseModel):
    """One row in the eligibility matrix — a supplier's checks and verdict."""
    supplier_id: str
    supplier_name: str
    overall_status: CheckStatus
    checks: List[EligibilityCheckResponse]


class EligibilityMatrixResponse(BaseModel):
    """
    The full eligibility matrix for a case.

    Structure:  rows = suppliers, columns = mandatory requirements.
    The frontend renders this as a color-coded grid:
      green (PASS), red (FAIL), amber (REVIEW).
    """
    case_id: str
    requirement_keys: List[str] = Field(
        ...,
        description="Ordered list of mandatory requirement keys (column headers).",
    )
    suppliers: List[SupplierEligibilitySummary]
