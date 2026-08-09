"""
Mocked API routes for Evidence.

Implements Module 1.4 specifications.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import evidence_repo, supplier_repo
from app.schemas.evidence import EvidenceListResponse
from app.schemas.common import EvidenceState

router = APIRouter(prefix="/suppliers/{supplier_id}/evidence", tags=["evidence"])

@router.get("", response_model=EvidenceListResponse)
def list_evidence(supplier_id: str, db: Session = Depends(get_db)):
    """Retrieve evidence for a supplier."""
    supplier = supplier_repo.get_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    evidence_records = evidence_repo.get_for_supplier(db, supplier_id)
    return {
        "evidence": evidence_records,
        "total": len(evidence_records)
    }
