"""
Requirement repository — CRUD operations for the Requirement entity.

Implements: replace_for_case(), get_for_case(), get_by_id().

Requirements use PUT (replace-all) semantics rather than PATCH to avoid
partial-state consistency problems.  `replace_for_case()` atomically
deletes old requirements and inserts the new set in one transaction.
"""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import Requirement

logger = logging.getLogger("sourcesure.repositories.requirement")


# ---------------------------------------------------------------------------
# Replace all requirements for a case (PUT semantics)
# ---------------------------------------------------------------------------

def replace_for_case(
    db: Session,
    case_id: str,
    requirements_data: List[dict],
) -> List[Requirement]:
    """
    Atomically replace every requirement belonging to a case.

    1. Delete all existing requirements for the case.
    2. Insert the new set from the validated Pydantic dicts.
    3. Commit as a single transaction — no partial state is possible.

    Args:
        db: Active database session.
        case_id: UUID of the parent sourcing case.
        requirements_data: List of dicts matching RequirementCreate fields.

    Returns:
        The newly inserted Requirement ORM instances.
    """
    # --- Step 1: remove existing requirements for this case -----------------
    db.query(Requirement).filter(Requirement.case_id == case_id).delete(
        synchronize_session="fetch"
    )

    # --- Step 2: build and insert new ORM instances -------------------------
    new_requirements: List[Requirement] = []
    for req_data in requirements_data:
        requirement = Requirement(case_id=case_id, **req_data)
        db.add(requirement)
        new_requirements.append(requirement)

    # --- Step 3: commit atomically ------------------------------------------
    db.commit()
    for req in new_requirements:
        db.refresh(req)

    logger.info(
        "requirements_replaced case_id=%s count=%d",
        case_id,
        len(new_requirements),
    )
    return new_requirements


# ---------------------------------------------------------------------------
# Read — all requirements for a case
# ---------------------------------------------------------------------------

def get_for_case(
    db: Session,
    case_id: str,
    *,
    kind: Optional[str] = None,
) -> List[Requirement]:
    """
    Retrieve all requirements for a case, optionally filtered by kind.

    Args:
        db: Active database session.
        case_id: UUID of the parent sourcing case.
        kind: Optional filter — 'MANDATORY' or 'PREFERENCE'.

    Returns:
        List of Requirement ORM instances matching the filters.
    """
    query = db.query(Requirement).filter(Requirement.case_id == case_id)

    if kind is not None:
        query = query.filter(Requirement.kind == kind)

    return query.order_by(Requirement.key).all()


# ---------------------------------------------------------------------------
# Read — single requirement by ID
# ---------------------------------------------------------------------------

def get_by_id(db: Session, requirement_id: str) -> Optional[Requirement]:
    """
    Fetch a single requirement by its UUID.

    Returns:
        The Requirement instance, or None if not found.
    """
    return db.query(Requirement).filter(Requirement.id == requirement_id).first()
