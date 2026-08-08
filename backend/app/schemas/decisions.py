"""
Decision Summary schemas — LLM-generated advisory and human decision recording.

The DecisionSummary is an LLM-generated report that may ONLY reference
stored facts (evidence).  It must NOT infer new information.

`human_decision` records the buyer's actual choice.  This field is
explicitly NOT an approval or supplier contact action — the UI must
clearly label this boundary (Non-Negotiable Rule #7).
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class DecisionSummaryResponse(BaseModel):
    """
    Full decision summary as returned by the API.

    The `generated_text` contains the LLM advisory grounded exclusively
    in stored evidence.  `assumptions`, `limitations`, and `review_actions`
    are structured lists for the frontend to render as checklists.
    """
    id: str
    case_id: str
    scenario_id: str
    recommended_supplier_id: Optional[str] = None
    generated_text: str
    assumptions: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    review_actions: List[str] = Field(default_factory=list)
    human_decision: Optional[str] = None
    human_decision_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════════
# Patch Schemas (partial updates)
# ═══════════════════════════════════════════════════════════════════════════


class HumanDecisionPatch(BaseModel):
    """
    Payload for PATCH /decision-summaries/{summary_id}/human-decision.

    Records the buyer's decision alongside the advisory.  This is
    decision support only — SourceSure does not contact or approve suppliers.
    """
    human_decision: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The buyer's recorded decision or notes.",
    )
