"""
Evidence schemas — read representations for extracted claims.

Evidence records are created by the extraction pipeline (Phase 2) and
consumed by the eligibility engine (Phase 3) and ranking engine (Phase 4).
They are never created directly by the client — there is no "EvidenceCreate"
schema.

Every evidence record carries a full citation chain (document_id,
page_number, sheet_name, cell_range, section, quoted_text) to satisfy
the traceability mandate.
"""

from datetime import date, datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import EvidenceState


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class EvidenceResponse(BaseModel):
    """A single extracted claim with its full citation chain."""
    id: str
    supplier_id: str
    document_id: str
    extraction_run_id: str

    # --- Extracted data -------------------------------------------------------
    field_key: str
    raw_value: str
    normalized_value: Optional[Any] = None
    unit: Optional[str] = None
    state: EvidenceState
    confidence: float = Field(..., ge=0.0, le=1.0)

    # --- Citation chain (traceability mandate) --------------------------------
    quoted_text: Optional[str] = None
    page_number: Optional[int] = None
    sheet_name: Optional[str] = None
    cell_range: Optional[str] = None
    section: Optional[str] = None
    provenance_method: Optional[str] = None
    validation_reason: Optional[str] = None

    retrieval_date: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EvidenceListResponse(BaseModel):
    """Response wrapper for GET /suppliers/{supplier_id}/evidence."""
    evidence: List[EvidenceResponse]
    total: int = Field(..., ge=0)
