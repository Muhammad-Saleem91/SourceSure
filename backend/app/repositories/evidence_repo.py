"""
Evidence repository — CRUD operations for the Evidence entity.

Implements: create_batch(), get_for_supplier(), get_for_requirement().

Evidence records are append-only — created by the extraction pipeline
(Phase 2) and consumed by the eligibility engine (Phase 3) and ranking
engine (Phase 4).  They are never modified after creation except for
`state` transitions (e.g. marking as OVERRIDDEN or CONFLICTING).

The `get_for_requirement()` method is specifically designed for the
eligibility evaluator, which needs all evidence for a given supplier +
field_key combination.
"""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import Evidence

logger = logging.getLogger("sourcesure.repositories.evidence")


# ---------------------------------------------------------------------------
# Create — batch insert
# ---------------------------------------------------------------------------

def create_batch(
    db: Session,
    evidence_records: List[dict],
) -> List[Evidence]:
    """
    Insert a batch of evidence records in a single transaction.

    Called by the extraction service after LLM output has been validated
    and normalized.  Each dict must contain all required Evidence fields.

    Args:
        db: Active database session.
        evidence_records: List of dicts matching Evidence model columns.

    Returns:
        List of newly created Evidence ORM instances.
    """
    instances: List[Evidence] = []
    for record_data in evidence_records:
        evidence = Evidence(**record_data)
        db.add(evidence)
        instances.append(evidence)

    db.commit()
    for instance in instances:
        db.refresh(instance)

    logger.info("evidence_batch_created count=%d", len(instances))
    return instances


# ---------------------------------------------------------------------------
# Read — all evidence for a supplier (with optional filters)
# ---------------------------------------------------------------------------

def get_for_supplier(
    db: Session,
    supplier_id: str,
    *,
    field_key: Optional[str] = None,
    state: Optional[str] = None,
    document_id: Optional[str] = None,
) -> List[Evidence]:
    """
    Retrieve evidence for a supplier with optional filtering.

    Supports three independent filters that can be combined:
      - field_key: filter by requirement key (e.g. 'cnc_5axis')
      - state: filter by evidence state (e.g. 'SUPPORTED', 'CONFLICTING')
      - document_id: filter by source document

    Args:
        db: Active database session.
        supplier_id: UUID of the supplier.
        field_key: Optional filter by requirement key.
        state: Optional filter by evidence state.
        document_id: Optional filter by source document.

    Returns:
        List of Evidence ORM instances matching the filters.
    """
    query = db.query(Evidence).filter(Evidence.supplier_id == supplier_id)

    if field_key is not None:
        query = query.filter(Evidence.field_key == field_key)
    if state is not None:
        query = query.filter(Evidence.state == state)
    if document_id is not None:
        query = query.filter(Evidence.document_id == document_id)

    return query.order_by(Evidence.created_at).all()


# ---------------------------------------------------------------------------
# Read — evidence for a specific requirement (used by eligibility engine)
# ---------------------------------------------------------------------------

def get_for_requirement(
    db: Session,
    supplier_id: str,
    field_key: str,
) -> List[Evidence]:
    """
    Retrieve all evidence for a supplier + field_key pair.

    This is the primary query used by the eligibility evaluator (Module 3.1).
    It returns ALL evidence states (including OVERRIDDEN) so the evaluator
    can apply its own filtering logic.

    Args:
        db: Active database session.
        supplier_id: UUID of the supplier being evaluated.
        field_key: The requirement key to match evidence against.

    Returns:
        List of Evidence instances for this supplier + field_key,
        ordered by creation time (oldest first).
    """
    return (
        db.query(Evidence)
        .filter(
            Evidence.supplier_id == supplier_id,
            Evidence.field_key == field_key,
        )
        .order_by(Evidence.created_at)
        .all()
    )
