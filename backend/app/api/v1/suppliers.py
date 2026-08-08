"""
Mocked API routes for Suppliers.

Implements Module 1.4 specifications.
"""
from datetime import datetime

from fastapi import APIRouter, status

from app.schemas.suppliers import SupplierCreate, SupplierResponse, SupplierListResponse
from app.schemas.common import SupplierStatus

router = APIRouter(prefix="/cases/{case_id}/suppliers", tags=["suppliers"])

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(case_id: str, supplier_in: SupplierCreate) -> dict:
    """Mock endpoint to add a supplier to a case."""
    return {
        "id": "sup-mock-1",
        "case_id": case_id,
        "name": supplier_in.name,
        "external_ref": supplier_in.external_ref,
        "country": supplier_in.country,
        "status": SupplierStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@router.get("", response_model=SupplierListResponse)
def list_suppliers(case_id: str) -> dict:
    """Mock endpoint to retrieve all suppliers for a case."""
    mocked_suppliers = [
        {
            "id": "sup-1",
            "case_id": case_id,
            "name": "Supplier A",
            "external_ref": "SUP-A",
            "country": "PK",
            "status": SupplierStatus.PASS,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "id": "sup-2",
            "case_id": case_id,
            "name": "Supplier B",
            "external_ref": "SUP-B",
            "country": "CN",
            "status": SupplierStatus.FAIL,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    ]
    return {
        "suppliers": mocked_suppliers,
        "total": 2
    }
