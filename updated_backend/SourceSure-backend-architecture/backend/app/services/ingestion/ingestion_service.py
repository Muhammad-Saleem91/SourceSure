"""
Ingestion Service — Module 2.1c

Orchestrates the validation, storage, and database registration of uploaded files.
"""

import logging
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.schemas.documents import DocumentResponse
from app.repositories import document_repo
from app.services.ingestion.validator import validate_file
from app.services.ingestion.storage import save_file

logger = logging.getLogger(__name__)

async def ingest_file(supplier_id: str, file: UploadFile, db: Session) -> DocumentResponse:
    """
    Validates, saves, and creates a Document record for an uploaded file.
    """
    logger.info("Ingesting new file: %s for supplier_id=%s", file.filename, supplier_id)
    
    # 1. Validate
    extension = await validate_file(file)
    logger.debug("File validated. Extension: %s", extension)
    
    # 2. Store on disk
    filepath, sha256 = await save_file(file, extension)
    logger.info("File saved to %s (sha256=%s)", filepath, sha256[:8])
    
    # 3. Create DB Record
    original_filename = file.filename.split("/")[-1].split("\\")[-1] if file.filename else "unknown_file"
    
    document = document_repo.create(
        db,
        supplier_id=supplier_id,
        display_name=original_filename,
        stored_path=filepath,
        mime_type=file.content_type or "application/octet-stream",
        sha256=sha256
    )
    
    logger.info("Document record created: id=%s", document.id)
    return DocumentResponse.model_validate(document)
