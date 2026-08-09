"""
Sourcing Case repository — CRUD operations for the SourcingCase entity.

Implements: create(), get_by_id(), list_all(), update_status().

This is the Data Access Layer for the top-level aggregate root.  The service
layer calls these methods to persist and retrieve cases without touching
SQLAlchemy directly.
"""

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import SourcingCase

logger = logging.getLogger("sourcesure.repositories.case")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create(
    db: Session,
    *,
    name: str,
    description: Optional[str] = None,
    evaluation_date=None,
) -> SourcingCase:
    """
    Insert a new sourcing case with DRAFT status.

    Args:
        db: Active database session (from get_db dependency).
        name: Descriptive case name (validated upstream by Pydantic).
        description: Optional procurement context.
        evaluation_date: Date for certificate validity checks.

    Returns:
        The newly created SourcingCase ORM instance with its generated UUID.
    """
    case = SourcingCase(
        name=name,
        description=description,
        evaluation_date=evaluation_date,
        status="DRAFT",
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    logger.info("case_created case_id=%s name=%s", case.id, case.name)
    return case


# ---------------------------------------------------------------------------
# Read — single
# ---------------------------------------------------------------------------

def get_by_id(db: Session, case_id: str) -> Optional[SourcingCase]:
    """
    Fetch a single sourcing case by its UUID.

    Returns:
        The SourcingCase instance, or None if not found.
    """
    return db.query(SourcingCase).filter(SourcingCase.id == case_id).first()


# ---------------------------------------------------------------------------
# Read — list
# ---------------------------------------------------------------------------

def list_all(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
) -> tuple[List[SourcingCase], int]:
    """
    Retrieve a paginated list of all sourcing cases, ordered by newest first.

    Args:
        db: Active database session.
        page: 1-indexed page number.
        page_size: Maximum items per page (capped at 200 by schema).

    Returns:
        A tuple of (list_of_cases, total_count).
    """
    query = db.query(SourcingCase).order_by(SourcingCase.created_at.desc())

    total = query.count()
    offset = (page - 1) * page_size
    cases = query.offset(offset).limit(page_size).all()

    return cases, total


# ---------------------------------------------------------------------------
# Update — status transition
# ---------------------------------------------------------------------------

def update_status(
    db: Session,
    case_id: str,
    new_status: str,
) -> Optional[SourcingCase]:
    """
    Transition a sourcing case to a new status.

    The caller (service layer) is responsible for validating the transition
    is legal (e.g. DRAFT → ACTIVE, not COMPLETED → DRAFT).

    Returns:
        The updated SourcingCase instance, or None if the case was not found.
    """
    case = get_by_id(db, case_id)
    if case is None:
        return None

    case.status = new_status
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)

    logger.info("case_status_updated case_id=%s new_status=%s", case_id, new_status)
    return case
