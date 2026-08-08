"""
Mocked API routes for Sourcing Cases.

Implements Module 1.4 specifications.
All routes return hardcoded fixture data matching the response schemas.
"""
from datetime import datetime, date
import uuid

from fastapi import APIRouter, status

from app.schemas.cases import CaseCreate, CaseResponse, CaseAnalysis
from app.schemas.common import CaseStatus

router = APIRouter(prefix="/cases", tags=["cases"])

MOCK_CASE_ID = "00000000-0000-0000-0000-000000000001"

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(case_in: CaseCreate) -> dict:
    """Mock endpoint to create a new sourcing case."""
    return {
        "id": MOCK_CASE_ID,
        "name": case_in.name,
        "description": case_in.description,
        "evaluation_date": case_in.evaluation_date or date.today(),
        "status": CaseStatus.DRAFT,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str) -> dict:
    """Mock endpoint to get a sourcing case by ID."""
    return {
        "id": case_id,
        "name": "Aluminum Motor Housing Q3 2026",
        "description": "Mocked case description",
        "evaluation_date": date.today(),
        "status": CaseStatus.ACTIVE,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@router.get("/{case_id}/analysis", response_model=CaseAnalysis)
def get_case_analysis(case_id: str) -> dict:
    """Mock endpoint to return the aggregate read model for the frontend dashboard."""
    case_data = {
        "id": case_id,
        "name": "Aluminum Motor Housing Q3 2026",
        "description": "Mocked case analysis",
        "evaluation_date": date.today(),
        "status": CaseStatus.ACTIVE,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    suppliers_data = [
        {"id": "sup-1", "name": "Supplier A", "status": "PASS", "document_count": 1, "has_evidence": True},
        {"id": "sup-2", "name": "Supplier B", "status": "FAIL", "document_count": 1, "has_evidence": True},
    ]

    return {
        "case": case_data,
        "suppliers": suppliers_data,
        "eligibility_ready": True,
        "ranking_ready": True,
        "warnings": ["Supplier B is failing."],
        "active_scenario_id": None,
    }
