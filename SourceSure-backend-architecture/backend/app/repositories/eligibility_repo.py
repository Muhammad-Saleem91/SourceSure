"""
Eligibility repository — persistence for EligibilityCheck and EligibilityResult.

Implements: save_checks(), save_result(), get_latest_for_supplier(),
            get_matrix_for_case().

The eligibility engine (Module 3.1) produces check and result objects as
pure data structures.  This repository converts them to ORM instances and
persists them.  It also provides the read queries needed by the matrix
endpoint (GET /cases/{case_id}/eligibility).
"""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import (
    EligibilityCheck,
    EligibilityResult,
    Supplier,
)

logger = logging.getLogger("sourcesure.repositories.eligibility")


# ---------------------------------------------------------------------------
# Save — batch of eligibility checks for one supplier
# ---------------------------------------------------------------------------

def save_checks(
    db: Session,
    checks_data: List[dict],
) -> List[EligibilityCheck]:
    """
    Persist a batch of eligibility check results.

    Each dict must contain all required EligibilityCheck fields including
    case_id, supplier_id, requirement_id, status, reason_code, and
    rule_version.

    Args:
        db: Active database session.
        checks_data: List of dicts matching EligibilityCheck model columns.

    Returns:
        List of newly created EligibilityCheck ORM instances.
    """
    instances: List[EligibilityCheck] = []
    for check_data in checks_data:
        check = EligibilityCheck(**check_data)
        db.add(check)
        instances.append(check)

    db.commit()
    for instance in instances:
        db.refresh(instance)

    logger.info("eligibility_checks_saved count=%d", len(instances))
    return instances


# ---------------------------------------------------------------------------
# Save — aggregated eligibility result for one supplier
# ---------------------------------------------------------------------------

def save_result(
    db: Session,
    *,
    case_id: str,
    supplier_id: str,
    status: str,
    check_ids: List[str],
    rule_version: str,
) -> EligibilityResult:
    """
    Persist the aggregated eligibility verdict for a supplier.

    This is the output of the aggregator function (Module 3.1):
      any FAIL → FAIL  >  any REVIEW → REVIEW  >  all PASS → PASS

    Args:
        db: Active database session.
        case_id: UUID of the sourcing case.
        supplier_id: UUID of the evaluated supplier.
        status: Aggregated verdict — PASS, FAIL, or REVIEW.
        check_ids: List of EligibilityCheck UUIDs that produced this result.
        rule_version: Version of the rule engine used for evaluation.

    Returns:
        The newly created EligibilityResult ORM instance.
    """
    result = EligibilityResult(
        case_id=case_id,
        supplier_id=supplier_id,
        status=status,
        check_ids=check_ids,
        rule_version=rule_version,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    logger.info(
        "eligibility_result_saved result_id=%s supplier_id=%s status=%s",
        result.id,
        supplier_id,
        status,
    )
    return result


# ---------------------------------------------------------------------------
# Read — latest result for a supplier
# ---------------------------------------------------------------------------

def get_latest_for_supplier(
    db: Session,
    case_id: str,
    supplier_id: str,
) -> Optional[EligibilityResult]:
    """
    Fetch the most recent eligibility result for a supplier within a case.

    The eligibility engine may run multiple times (e.g. after new evidence).
    This returns only the latest evaluation, which is the authoritative one.

    Returns:
        The most recent EligibilityResult, or None if never evaluated.
    """
    return (
        db.query(EligibilityResult)
        .filter(
            EligibilityResult.case_id == case_id,
            EligibilityResult.supplier_id == supplier_id,
        )
        .order_by(EligibilityResult.evaluated_at.desc())
        .first()
    )


def delete_for_supplier(db: Session, supplier_id: str):
    """Delete all eligibility checks and results for a supplier to cleanly re-evaluate."""
    db.query(EligibilityCheck).filter(EligibilityCheck.supplier_id == supplier_id).delete(synchronize_session=False)
    db.query(EligibilityResult).filter(EligibilityResult.supplier_id == supplier_id).delete(synchronize_session=False)
    db.commit()


def get_checks_for_supplier(db: Session, supplier_id: str) -> List[EligibilityCheck]:
    """Get all eligibility checks for a supplier (useful for testing/debugging)."""
    return db.query(EligibilityCheck).filter(EligibilityCheck.supplier_id == supplier_id).all()


# ---------------------------------------------------------------------------
# Read — full eligibility matrix for a case
# ---------------------------------------------------------------------------

def get_matrix_for_case(
    db: Session,
    case_id: str,
) -> List[dict]:
    """
    Build the eligibility matrix data for a case.

    Returns a list of dicts, one per supplier, each containing the supplier
    info, their overall status, and their individual checks.  The service
    layer transforms this into the EligibilityMatrixResponse schema.

    Returns:
        List of dicts with keys: supplier_id, supplier_name, overall_status,
        checks (list of EligibilityCheck ORM instances).
    """
    # --- Fetch all suppliers for this case ----------------------------------
    suppliers = (
        db.query(Supplier)
        .filter(Supplier.case_id == case_id)
        .order_by(Supplier.name)
        .all()
    )

    matrix_rows: List[dict] = []

    for supplier in suppliers:
        # --- Get the latest eligibility result for this supplier -------------
        latest_result = get_latest_for_supplier(db, case_id, supplier.id)

        # --- Get all checks for the latest evaluation -----------------------
        checks: List[EligibilityCheck] = []
        overall_status = "PENDING"

        if latest_result is not None:
            overall_status = latest_result.status
            checks = (
                db.query(EligibilityCheck)
                .filter(
                    EligibilityCheck.case_id == case_id,
                    EligibilityCheck.supplier_id == supplier.id,
                    EligibilityCheck.id.in_(latest_result.check_ids or []),
                )
                .all()
            )

        matrix_rows.append({
            "supplier_id": supplier.id,
            "supplier_name": supplier.name,
            "overall_status": overall_status,
            "checks": checks,
        })

    return matrix_rows
