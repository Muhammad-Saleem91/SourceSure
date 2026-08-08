"""
Mocked API routes for Requirements.

Implements Module 1.4 specifications.
"""
from typing import List

from fastapi import APIRouter

from app.schemas.requirements import RequirementResponse, RequirementsUpdate

router = APIRouter(prefix="/cases/{case_id}/requirements", tags=["requirements"])

@router.put("", response_model=List[RequirementResponse])
def replace_requirements(case_id: str, requirements_in: RequirementsUpdate) -> list[dict]:
    """Mock endpoint to validate and store requirements for a case."""
    mocked_responses = []
    for i, req in enumerate(requirements_in.requirements):
        mocked_responses.append({
            "id": f"req-{i}",
            "case_id": case_id,
            "key": req.key,
            "label": req.label,
            "kind": req.kind,
            "value_type": req.value_type,
            "operator": req.operator,
            "target_value": req.target_value,
            "unit": req.unit,
            "allowed_values": req.allowed_values,
            "weight": req.weight,
            "direction": req.direction,
            "notes": req.notes,
        })
    return mocked_responses
