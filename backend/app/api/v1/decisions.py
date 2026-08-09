"""
API routes for Decisions — Module 5.1c.

Replaces the Phase 1 mocked endpoints with real service calls.

POST /cases/{case_id}/decision-summaries
    → summary_service.generate_decision_summary()

PATCH /decision-summaries/{summary_id}/human-decision
    → human_decision_service.record_human_decision()
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.decisions import (
    DecisionSummaryCreate,
    DecisionSummaryResponse,
    HumanDecisionPatch,
)
from app.services.reporting import human_decision_service, summary_service

router = APIRouter(tags=["decisions"])


# ═══════════════════════════════════════════════════════════════════════════
# POST — Generate Decision Summary
# ═══════════════════════════════════════════════════════════════════════════


@router.post(
    "/cases/{case_id}/decision-summaries",
    response_model=DecisionSummaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_decision_summary(
    case_id: str,
    body: DecisionSummaryCreate,
    db: Session = Depends(get_db),
) -> DecisionSummaryResponse:
    """
    Generate an LLM-grounded decision advisory for a ranking scenario.

    The recommended supplier is computed deterministically from the
    ranking engine's rank-1 result.  The LLM only explains the
    existing decision — it does not choose a supplier.

    Idempotent: returns the existing summary if one was already
    generated for this scenario.
    """
    summary = summary_service.generate_decision_summary(
        db=db,
        case_id=case_id,
        scenario_id=body.scenario_id,
    )
    return DecisionSummaryResponse.model_validate(summary)


# ═══════════════════════════════════════════════════════════════════════════
# PATCH — Record Human Decision
# ═══════════════════════════════════════════════════════════════════════════


@router.patch(
    "/decision-summaries/{summary_id}/human-decision",
    response_model=DecisionSummaryResponse,
)
def patch_human_decision(
    summary_id: str,
    patch_in: HumanDecisionPatch,
    db: Session = Depends(get_db),
) -> DecisionSummaryResponse:
    """
    Record the buyer's actual decision alongside the LLM advisory.

    This is decision support only — SourceSure does NOT contact or
    approve suppliers.  The UI must clearly label this boundary.
    """
    updated = human_decision_service.record_human_decision(
        db=db,
        summary_id=summary_id,
        human_decision=patch_in.human_decision,
    )
    return DecisionSummaryResponse.model_validate(updated)
