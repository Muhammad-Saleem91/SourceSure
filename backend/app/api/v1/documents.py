"""
Mocked API routes for Documents.

Implements Module 1.4 specifications.
"""
from datetime import datetime

from fastapi import APIRouter, status, UploadFile, File

from app.schemas.documents import DocumentUploadResponse, DocumentResponse
from app.schemas.common import DocumentStatus

router = APIRouter(tags=["documents"])

@router.post("/suppliers/{supplier_id}/documents", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
def upload_document(supplier_id: str, file: UploadFile = File(...)) -> dict:
    """Mock endpoint for document upload."""
    return {
        "id": "doc-mock-1",
        "display_name": file.filename or "mocked_file.pdf",
        "status": DocumentStatus.UPLOADED,
        "message": "Mocked document upload accepted."
    }

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str) -> dict:
    """Mock endpoint to retrieve document details."""
    return {
        "id": document_id,
        "supplier_id": "sup-mock-1",
        "display_name": "mocked_file.pdf",
        "stored_path": "/mock/path/mocked_file.pdf",
        "mime_type": "application/pdf",
        "sha256": "mockedhash256",
        "status": DocumentStatus.READY,
        "page_count": 5,
        "uploaded_at": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
