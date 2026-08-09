"""
Mocked API routes for Sourcing Cases.

Implements Module 1.4 specifications.
All routes return hardcoded fixture data matching the response schemas.
"""
from datetime import datetime, date
import uuid

from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cases import CaseCreate, CaseResponse, CaseAnalysis
from app.schemas.common import CaseStatus
from app.repositories import case_repo, supplier_repo
from app.services.reporting.case_analysis_service import get_case_analysis_read_model

router = APIRouter(prefix="/cases", tags=["cases"])

MOCK_CASE_ID = "00000000-0000-0000-0000-000000000001"

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    """Create a new sourcing case."""
    case = case_repo.create(
        db,
        name=case_in.name,
        description=case_in.description,
        evaluation_date=case_in.evaluation_date
    )
    return case

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    """Get a sourcing case by ID."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/{case_id}/analysis", response_model=CaseAnalysis)
def get_case_analysis(case_id: str, db: Session = Depends(get_db)):
    """Return the aggregate read model for the frontend dashboard."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    return get_case_analysis_read_model(db, case)
