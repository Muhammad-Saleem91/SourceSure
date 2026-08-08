"""
Supplier repository — CRUD operations for the Supplier entity.

Implements: create(), get_for_case(), get_by_id(), update_status().

Supplier status is updated exclusively by the eligibility engine
(Phase 3) — never by direct client input.  The `update_status()` method
is called by the eligibility service after aggregation.
"""

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import Supplier

logger = logging.getLogger("sourcesure.repositories.supplier")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create(
    db: Session,
    *,
    case_id: str,
    name: str,
    external_ref: Optional[str] = None,
    country: Optional[str] = None,
) -> Supplier:
    """
    Insert a new supplier into a sourcing case with PENDING status.

    Args:
        db: Active database session.
        case_id: UUID of the parent sourcing case.
        name: Supplier company name.
        external_ref: Optional external identifier from procurement system.
        country: Optional ISO 3166-1 alpha-2 country code.

    Returns:
        The newly created Supplier ORM instance.
    """
    supplier = Supplier(
        case_id=case_id,
        name=name,
        external_ref=external_ref,
        country=country,
        status="PENDING",
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    logger.info(
        "supplier_created supplier_id=%s case_id=%s name=%s",
        supplier.id,
        case_id,
        name,
    )
    return supplier


# ---------------------------------------------------------------------------
# Read — all suppliers for a case
# ---------------------------------------------------------------------------

def get_for_case(db: Session, case_id: str) -> List[Supplier]:
    """
    Retrieve all suppliers belonging to a case, ordered by creation time.

    Returns:
        List of Supplier ORM instances.
    """
    return (
        db.query(Supplier)
        .filter(Supplier.case_id == case_id)
        .order_by(Supplier.created_at)
        .all()
    )


# ---------------------------------------------------------------------------
# Read — single supplier by ID
# ---------------------------------------------------------------------------

def get_by_id(db: Session, supplier_id: str) -> Optional[Supplier]:
    """
    Fetch a single supplier by its UUID.

    Returns:
        The Supplier instance, or None if not found.
    """
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


# ---------------------------------------------------------------------------
# Update — status (called by eligibility engine, Phase 3)
# ---------------------------------------------------------------------------

def update_status(
    db: Session,
    supplier_id: str,
    new_status: str,
) -> Optional[Supplier]:
    """
    Update a supplier's eligibility status.

    This method is called exclusively by the eligibility service after
    the aggregator produces a PASS / FAIL / REVIEW verdict.  Client
    endpoints should never call this directly.

    Returns:
        The updated Supplier instance, or None if not found.
    """
    supplier = get_by_id(db, supplier_id)
    if supplier is None:
        return None

    supplier.status = new_status
    supplier.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(supplier)

    logger.info(
        "supplier_status_updated supplier_id=%s new_status=%s",
        supplier_id,
        new_status,
    )
    return supplier
