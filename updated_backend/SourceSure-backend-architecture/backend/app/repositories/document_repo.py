"""
Document repository — CRUD operations for the Document entity.

Implements: create(), get_by_id(), update_status(), get_for_supplier().

Documents represent uploaded files. Their status transitions through the
ingestion pipeline: UPLOADED → PARSING → EXTRACTING → READY | NEEDS_REVIEW | ERROR.
The service layer drives these transitions; this repository only persists them.
"""

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import Document

logger = logging.getLogger("sourcesure.repositories.document")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create(
    db: Session,
    *,
    supplier_id: str,
    display_name: str,
    stored_path: str,
    mime_type: str,
    sha256: str,
    page_count: Optional[int] = None,
) -> Document:
    """
    Insert a new document record for a supplier.

    The file itself is stored on disk by the ingestion service (Module 2.1).
    This method only persists the metadata.  The `stored_path` uses a
    server-generated UUID filename to prevent path traversal attacks.

    Args:
        db: Active database session.
        supplier_id: UUID of the owning supplier.
        display_name: Original filename as shown to the user.
        stored_path: Server-side path (UUID-based, no user input).
        mime_type: Validated MIME type (from the extension whitelist).
        sha256: File content hash for deduplication.
        page_count: Optional page count (set after parsing).

    Returns:
        The newly created Document ORM instance with UPLOADED status.
    """
    document = Document(
        supplier_id=supplier_id,
        display_name=display_name,
        stored_path=stored_path,
        mime_type=mime_type,
        sha256=sha256,
        status="UPLOADED",
        page_count=page_count,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    logger.info(
        "document_created document_id=%s supplier_id=%s mime=%s",
        document.id,
        supplier_id,
        mime_type,
    )
    return document


# ---------------------------------------------------------------------------
# Read — single document by ID
# ---------------------------------------------------------------------------

def get_by_id(db: Session, document_id: str) -> Optional[Document]:
    """
    Fetch a single document by its UUID.

    Returns:
        The Document instance, or None if not found.
    """
    return db.query(Document).filter(Document.id == document_id).first()


# ---------------------------------------------------------------------------
# Read — all documents for a supplier
# ---------------------------------------------------------------------------

def get_for_supplier(db: Session, supplier_id: str) -> List[Document]:
    """
    Retrieve all documents belonging to a supplier, ordered by upload time.

    Returns:
        List of Document ORM instances.
    """
    return (
        db.query(Document)
        .filter(Document.supplier_id == supplier_id)
        .order_by(Document.uploaded_at)
        .all()
    )


# ---------------------------------------------------------------------------
# Update — status transition
# ---------------------------------------------------------------------------

def update_status(
    db: Session,
    document_id: str,
    new_status: str,
    *,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
    page_count: Optional[int] = None,
) -> Optional[Document]:
    """
    Transition a document to a new processing status.

    Supports setting error details on failure and page count after parsing.
    The caller (ingestion service) is responsible for valid transitions.

    Args:
        db: Active database session.
        document_id: UUID of the document to update.
        new_status: Target status (e.g. PARSING, READY, ERROR).
        error_code: Machine-readable error code (only on ERROR status).
        error_message: Human-readable error detail (only on ERROR status).
        page_count: Set after parsing completes successfully.

    Returns:
        The updated Document instance, or None if not found.
    """
    document = get_by_id(db, document_id)
    if document is None:
        return None

    document.status = new_status
    document.updated_at = datetime.utcnow()

    # --- Conditionally set optional fields ----------------------------------
    if error_code is not None:
        document.error_code = error_code
    if error_message is not None:
        document.error_message = error_message
    if page_count is not None:
        document.page_count = page_count

    db.commit()
    db.refresh(document)

    logger.info(
        "document_status_updated document_id=%s new_status=%s",
        document_id,
        new_status,
    )
    return document
