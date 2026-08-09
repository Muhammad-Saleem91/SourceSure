"""
Decision Summary repository — CRUD operations for the DecisionSummary entity.

Implements: create(), patch_human_decision().

The DecisionSummary records the LLM's advisory (which must be based strictly
on extracted evidence) and later captures the actual human decision made by
the buyer.
"""

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import DecisionSummary

logger = logging.getLogger("sourcesure.repositories.decision")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create(
    db: Session,
    *,
    case_id: str,
    scenario_id: str,
    recommended_supplier_id: Optional[str],
    generated_text: str,
    assumptions: Optional[List[str]] = None,
    limitations: Optional[List[str]] = None,
    review_actions: Optional[List[str]] = None,
) -> DecisionSummary:
    """
    Persist an LLM-generated decision advisory report.

    Args:
        db: Active database session.
        case_id: UUID of the sourcing case.
        scenario_id: UUID of the ranking scenario this decision is based on.
        recommended_supplier_id: Optional UUID of the supplier recommended.
        generated_text: The main narrative body.
        assumptions: List of assumptions made by the LLM.
        limitations: List of limitations in the data.
        review_actions: Suggested manual verification actions.

    Returns:
        The newly created DecisionSummary ORM instance.
    """
    summary = DecisionSummary(
        case_id=case_id,
        scenario_id=scenario_id,
        recommended_supplier_id=recommended_supplier_id,
        generated_text=generated_text,
        assumptions=assumptions or [],
        limitations=limitations or [],
        review_actions=review_actions or [],
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    logger.info(
        "decision_summary_created summary_id=%s case_id=%s",
        summary.id,
        case_id,
    )
    return summary


# ---------------------------------------------------------------------------
# Update — record human decision
# ---------------------------------------------------------------------------

def patch_human_decision(
    db: Session,
    summary_id: str,
    human_decision: str,
) -> Optional[DecisionSummary]:
    """
    Record the buyer's actual choice based on the advisory.

    This implements Non-Negotiable Rule #7: the tool advises, the human
    decides. This function simply records their text entry.

    Args:
        db: Active database session.
        summary_id: UUID of the decision summary.
        human_decision: Free-text note or decision from the user.

    Returns:
        The updated DecisionSummary instance, or None if not found.
    """
    summary = (
        db.query(DecisionSummary)
        .filter(DecisionSummary.id == summary_id)
        .first()
    )
    
    if summary is None:
        return None

    summary.human_decision = human_decision
    summary.human_decision_at = datetime.utcnow()
    summary.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(summary)

    logger.info(
        "human_decision_recorded summary_id=%s case_id=%s",
        summary_id,
        summary.case_id,
    )
    return summary
