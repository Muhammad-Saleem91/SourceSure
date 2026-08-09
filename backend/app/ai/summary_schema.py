"""
Decision Summary LLM output schema — Module 5.1b.

Defines the Pydantic model that the LLM must produce when generating
a decision advisory.  This schema is validated before persistence,
exactly like `ExtractionOutput` is validated for document extraction.

SECURITY NOTE: `recommended_supplier_id` is intentionally EXCLUDED from
this schema.  The recommendation is computed deterministically by
`summary_service.py` using the rank-1 supplier from the ranking engine.
Allowing the LLM to output this field would create a prompt-injection
surface on the most client-facing artifact.
"""

from typing import List

from pydantic import BaseModel, Field


class SummaryOutput(BaseModel):
    """
    Structured output expected from the LLM summary generation pass.

    The LLM is constrained to generate ONLY these fields — no supplier
    selection, no score recalculation, no eligibility override.
    """
    generated_text: str = Field(
        ...,
        min_length=1,
        description="Grounded advisory narrative referencing evidence IDs.",
    )
    assumptions: List[str] = Field(
        default_factory=list,
        description="Assumptions made based on the available evidence.",
    )
    limitations: List[str] = Field(
        default_factory=list,
        description="Data gaps or limitations observed in the evidence.",
    )
    review_actions: List[str] = Field(
        default_factory=list,
        description="Suggested manual verification actions for the buyer.",
    )
