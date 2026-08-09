"""
Extraction Run repository — CRUD operations for the ExtractionRun entity.

Implements: create(), get_by_document_and_schema(), update_status().
"""

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import ExtractionRun

logger = logging.getLogger("sourcesure.repositories.extraction_run")


def create(
    db: Session,
    *,
    document_id: str,
    model: str,
    prompt_version: str,
    schema_version: str,
    status: str = "PENDING",
) -> ExtractionRun:
    """Insert a new extraction run record."""
    run = ExtractionRun(
        document_id=document_id,
        model=model,
        prompt_version=prompt_version,
        schema_version=schema_version,
        status=status,
        started_at=datetime.utcnow(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def get_completed_run(
    db: Session,
    document_id: str,
    model: str,
    prompt_version: str,
    schema_version: str,
) -> Optional[ExtractionRun]:
    """Check for an existing completed extraction run to support idempotency."""
    return (
        db.query(ExtractionRun)
        .filter(
            ExtractionRun.document_id == document_id,
            ExtractionRun.model == model,
            ExtractionRun.prompt_version == prompt_version,
            ExtractionRun.schema_version == schema_version,
            ExtractionRun.status == "COMPLETED",
        )
        .first()
    )


def update_status(
    db: Session,
    run_id: str,
    status: str,
    *,
    error: Optional[str] = None,
) -> Optional[ExtractionRun]:
    """Update status of a run, optionally setting error or completion time."""
    run = db.query(ExtractionRun).filter(ExtractionRun.id == run_id).first()
    if not run:
        return None

    run.status = status
    run.updated_at = datetime.utcnow()

    if status in ("COMPLETED", "ERROR"):
        run.completed_at = datetime.utcnow()

    if error is not None:
        run.error = error

    db.commit()
    db.refresh(run)
    return run
