"""
Document schemas — upload response and read representation.

Documents are files uploaded for a supplier (PDF, XLSX, DOCX, CSV).
The upload endpoint returns a 202 with the document ID and initial status
so the frontend can poll for processing completion.

No "DocumentCreate" input schema exists here because the upload endpoint
receives a multipart file (not a JSON body) — validation is handled by
the ingestion service (Phase 2, Module 2.1).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import DocumentStatus


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class DocumentUploadResponse(BaseModel):
    """
    Returned by POST /suppliers/{supplier_id}/documents (202 Accepted).

    Gives the frontend a document ID to poll for status transitions:
    UPLOADED → PARSING → EXTRACTING → READY | NEEDS_REVIEW | ERROR
    """
    id: str
    display_name: str
    status: DocumentStatus
    message: str = Field(
        default="Document accepted for processing.",
        description="Human-readable status explanation.",
    )


class DocumentResponse(BaseModel):
    """Full document record for GET /documents/{document_id}."""
    id: str
    supplier_id: str
    display_name: str
    stored_path: str
    mime_type: str
    sha256: str
    status: DocumentStatus
    page_count: Optional[int] = None
    uploaded_at: datetime
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
