"""
Human Decision Service — Module 5.1a.

Records the buyer's actual choice alongside the LLM advisory.

Non-Negotiable Rule #7: this function simply records a decision —
it does NOT trigger supplier approval, contact, or any consequential
action.  SourceSure is decision support only.
"""

import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.core.errors import AppError, ErrorCode
from app.repositories import decision_repo

logger = logging.getLogger("sourcesure.services.reporting.human_decision")


def record_human_decision(
    db: Session,
    summary_id: str,
    human_decision: str,
) -> "DecisionSummary":
    """
    Record the buyer's decision text on an existing advisory summary.

    This is explicitly NOT an approval action — the UI must clearly
    label this boundary.

    Args:
        db: Active database session.
        summary_id: UUID of the DecisionSummary to update.
        human_decision: Free-text note or decision from the buyer.

    Returns:
        The updated DecisionSummary ORM instance.

    Raises:
        AppError(NOT_FOUND): If the summary does not exist.
    """
    updated = decision_repo.patch_human_decision(
        db, summary_id, human_decision
    )

    if updated is None:
        raise AppError(
            code=ErrorCode.NOT_FOUND,
            message=f"Decision summary '{summary_id}' not found.",
            status_code=404,
        )

    logger.info(
        "human_decision_recorded summary_id=%s case_id=%s",
        summary_id,
        updated.case_id,
    )
    return updated
