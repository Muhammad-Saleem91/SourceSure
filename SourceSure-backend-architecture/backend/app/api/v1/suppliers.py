"""
Mocked API routes for Suppliers.

Implements Module 1.4 specifications.
"""
from datetime import datetime

from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import supplier_repo, case_repo
from app.schemas.suppliers import SupplierCreate, SupplierResponse, SupplierListResponse
from app.schemas.common import SupplierStatus

router = APIRouter(prefix="/cases/{case_id}/suppliers", tags=["suppliers"])

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(case_id: str, supplier_in: SupplierCreate, db: Session = Depends(get_db)):
    """Add a supplier to a case."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    supplier = supplier_repo.create(
        db,
        case_id=case_id,
        name=supplier_in.name,
        external_ref=supplier_in.external_ref,
        country=supplier_in.country
    )
    return supplier

@router.get("", response_model=SupplierListResponse)
def list_suppliers(case_id: str, db: Session = Depends(get_db)):
    """Retrieve all suppliers for a case."""
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    suppliers = supplier_repo.get_for_case(db, case_id)
    return {
        "suppliers": suppliers,
        "total": len(suppliers)
    }

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, db: Session = Depends(get_db)):
    """Retrieve a single supplier by ID."""
    # Note: case_id from prefix is technically ignored since we have global unique supplier_id
    supplier = supplier_repo.get_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier
