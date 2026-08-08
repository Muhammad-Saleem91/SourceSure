"""
Mocked API routes for Evidence.

Implements Module 1.4 specifications.
"""
from datetime import datetime

from fastapi import APIRouter

from app.schemas.evidence import EvidenceListResponse
from app.schemas.common import EvidenceState

router = APIRouter(prefix="/suppliers/{supplier_id}/evidence", tags=["evidence"])

@router.get("", response_model=EvidenceListResponse)
def list_evidence(supplier_id: str) -> dict:
    """Mock endpoint to retrieve evidence for a supplier."""
    mocked_evidence = [
        {
            "id": "ev-mock-1",
            "supplier_id": supplier_id,
            "document_id": "doc-mock-1",
            "extraction_run_id": "run-mock-1",
            "field_key": "cnc_5axis",
            "raw_value": "We have 5-axis CNC machines.",
            "normalized_value": True,
            "unit": None,
            "state": EvidenceState.SUPPORTED,
            "confidence": 0.95,
            "quoted_text": "We have 5-axis CNC machines.",
            "page_number": 1,
            "created_at": datetime.utcnow(),
        }
    ]
    return {
        "evidence": mocked_evidence,
        "total": 1
    }
