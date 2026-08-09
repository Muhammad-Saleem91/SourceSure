"""
API routes for Eligibility.

Implements Module 1.4 specifications.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.eligibility.eligibility_service import evaluate_supplier
from app.repositories import supplier_repo, case_repo, eligibility_repo

from app.schemas.eligibility import EligibilityRunRequest, EligibilityRunResponse, EligibilityMatrixResponse

router = APIRouter(prefix="/cases/{case_id}", tags=["eligibility"])

@router.post("/eligibility-runs", response_model=EligibilityRunResponse)
def run_eligibility(case_id: str, run_in: EligibilityRunRequest, db: Session = Depends(get_db)) -> dict:
    """Trigger an eligibility run for the specified suppliers (or all pending suppliers)."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    supplier_ids = run_in.supplier_ids
    if not supplier_ids:
        # Default to all suppliers in case if not specified
        suppliers = supplier_repo.get_for_case(db, case_id)
        supplier_ids = [s.id for s in suppliers]

    results_count = {"PASS": 0, "FAIL": 0, "REVIEW": 0}
    for sid in supplier_ids:
        supplier = supplier_repo.get_by_id(db, sid)
        if not supplier:
            raise HTTPException(status_code=404, detail=f"Supplier {sid} not found")
        if supplier.case_id != case_id:
            raise HTTPException(status_code=400, detail=f"Supplier {sid} does not belong to this case")

        status = evaluate_supplier(db, sid)
        results_count[status] = results_count.get(status, 0) + 1

    return {
        "case_id": case_id,
        "suppliers_evaluated": len(supplier_ids),
        "results": results_count
    }

@router.get("/eligibility", response_model=EligibilityMatrixResponse)
def get_eligibility_matrix(case_id: str, db: Session = Depends(get_db)):
    """Return the eligibility matrix for a case."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    matrix = eligibility_repo.get_matrix_for_case(db, case_id)
    
    # Supply requirement_keys for the grid column headers
    mandatory_reqs = [req.key for req in case.requirements if req.kind == "MANDATORY"]
    
    return {
        "case_id": case_id,
        "requirement_keys": mandatory_reqs,
        "suppliers": matrix
    }
