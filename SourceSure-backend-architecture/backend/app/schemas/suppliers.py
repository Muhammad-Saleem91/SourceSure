"""
Supplier schemas — create, read, and list responses.

Suppliers are candidates being evaluated within a sourcing case.
Their `status` starts as PENDING and is updated exclusively by the
eligibility engine — never by direct client input.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import SupplierStatus


# ═══════════════════════════════════════════════════════════════════════════
# Request Schemas (inputs)
# ═══════════════════════════════════════════════════════════════════════════


class SupplierCreate(BaseModel):
    """Payload for POST /cases/{case_id}/suppliers."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Supplier company name.",
    )
    external_ref: Optional[str] = Field(
        default=None,
        max_length=100,
        description="External identifier (e.g. 'SUP-A' from procurement system).",
    )
    country: Optional[str] = Field(
        default=None,
        max_length=10,
        description="ISO 3166-1 alpha-2 country code (e.g. 'PK', 'CN', 'DE').",
    )


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class SupplierResponse(BaseModel):
    """Standard supplier representation returned by the API."""
    id: str
    case_id: str
    name: str
    external_ref: Optional[str] = None
    country: Optional[str] = None
    status: SupplierStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SupplierListResponse(BaseModel):
    """Response wrapper for GET /cases/{case_id}/suppliers."""
    suppliers: List[SupplierResponse]
    total: int = Field(..., ge=0)
