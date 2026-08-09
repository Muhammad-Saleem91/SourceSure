"""
Ranking schemas — scenario creation, score breakdown, and ranked results.

Only PASS suppliers may appear in ranking results (Golden Rule — enforced
server-side in the ranking service, Module 4.2).  The score breakdown
provides full transparency: raw_value → normalized_score → weight →
weighted_score for each preference criterion.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import NormalizationMethod


# ═══════════════════════════════════════════════════════════════════════════
# Request Schemas (inputs)
# ═══════════════════════════════════════════════════════════════════════════


class RankingScenarioCreate(BaseModel):
    """
    Payload for POST /cases/{case_id}/ranking-scenarios.

    Weights are a dict mapping preference requirement keys to floats.
    The service normalizes them to sum to 1.0 and validates that all
    keys correspond to actual PREFERENCE requirements.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Descriptive name (e.g. 'Quality First', 'Balanced').",
    )
    weights: Dict[str, float] = Field(
        ...,
        description="Map of requirement_key → weight (will be normalized to sum to 1.0).",
    )
    normalization_method: NormalizationMethod = Field(
        default=NormalizationMethod.MIN_MAX_V1,
        description="Algorithm for normalizing raw values into 0-100 scores.",
    )


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class ScoreComponentResponse(BaseModel):
    """
    One preference criterion's contribution to a supplier's total score.

    Provides full scoring transparency for the frontend breakdown table:
    raw → normalized → weight → contribution.
    """
    id: str
    requirement_id: str
    raw_value: Optional[float] = None
    normalized_score: Optional[float] = None
    weight: float
    weighted_score: float
    evidence_ids: List[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class RankingResultResponse(BaseModel):
    """
    A single supplier's position and score within a ranking scenario.

    Only PASS suppliers appear here — FAIL/REVIEW are excluded server-side.
    """
    id: str
    supplier_id: str
    supplier_name: Optional[str] = None
    eligibility_result_id: str
    total_score: float
    rank: int = Field(..., ge=1)
    ranking_version: str
    calculated_at: datetime
    score_components: List[ScoreComponentResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class RankingScenarioResponse(BaseModel):
    """Full scenario with its ranked results and weight configuration."""
    id: str
    case_id: str
    name: str
    weights: Dict[str, float]
    normalization_method: NormalizationMethod
    created_at: datetime
    results: List[RankingResultResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
