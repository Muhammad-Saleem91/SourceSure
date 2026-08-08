"""
Mocked API routes for Eligibility.

Implements Module 1.4 specifications.
"""
from typing import Dict, Any

from fastapi import APIRouter

from app.schemas.eligibility import EligibilityRunRequest, EligibilityRunResponse, EligibilityMatrixResponse
from app.schemas.common import CheckStatus

router = APIRouter(prefix="/cases/{case_id}", tags=["eligibility"])

@router.post("/eligibility-runs", response_model=EligibilityRunResponse)
def run_eligibility(case_id: str, run_in: EligibilityRunRequest) -> dict:
    """Mock endpoint to trigger an eligibility run."""
    return {
        "case_id": case_id,
        "suppliers_evaluated": len(run_in.supplier_ids) if run_in.supplier_ids else 3,
        "results": {
            "PASS": 1,
            "FAIL": 1,
            "REVIEW": 1
        }
    }

@router.get("/eligibility", response_model=EligibilityMatrixResponse)
def get_eligibility_matrix(case_id: str) -> dict:
    """Mock endpoint to return the eligibility matrix."""
    return {
        "case_id": case_id,
        "requirement_keys": ["cnc_5axis", "material_6061", "iso_9001"],
        "suppliers": [
            {
                "supplier_id": "sup-mock-1",
                "supplier_name": "Supplier A",
                "overall_status": CheckStatus.PASS,
                "checks": []
            }
        ]
    }
