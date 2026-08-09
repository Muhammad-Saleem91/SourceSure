"""
Mocked API routes for Requirements.

Implements Module 1.4 specifications.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import requirement_repo, case_repo
from app.schemas.requirements import RequirementResponse, RequirementsUpdate

router = APIRouter(prefix="/cases/{case_id}/requirements", tags=["requirements"])

@router.put("", response_model=List[RequirementResponse])
def replace_requirements(case_id: str, requirements_in: RequirementsUpdate, db: Session = Depends(get_db)):
    """Validate and store requirements for a case."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    reqs_data = [req.model_dump() for req in requirements_in.requirements]
    new_reqs = requirement_repo.replace_for_case(db, case_id, reqs_data)
    return new_reqs

@router.get("", response_model=List[RequirementResponse])
def get_requirements(case_id: str, db: Session = Depends(get_db)):
    """Get all requirements for a case."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    return requirement_repo.get_for_case(db, case_id)
