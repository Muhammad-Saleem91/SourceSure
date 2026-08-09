"""
Mocked API routes for Documents.

Implements Module 1.4 specifications.
"""
from datetime import datetime
from fastapi import APIRouter, status, UploadFile, File, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories import document_repo
from app.schemas.documents import DocumentResponse
from app.schemas.common import DocumentStatus
from app.services.ingestion.ingestion_service import ingest_file
from app.services.extraction.extraction_service import run_extraction_background

router = APIRouter(tags=["documents"])

@router.post("/suppliers/{supplier_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    supplier_id: str, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> DocumentResponse:
    """
    Uploads a document, saves it to disk, and queues it for extraction in the background.
    """
    document = await ingest_file(supplier_id, file, db)
    background_tasks.add_task(run_extraction_background, document.id)
    return document

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Retrieve document details."""
    document = document_repo.get_by_id(db, document_id)
    if not document:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")
    return document
