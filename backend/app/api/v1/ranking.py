"""
Mocked API routes for Ranking.

Implements Module 1.4 specifications.
"""
from datetime import datetime
import uuid

from fastapi import APIRouter

from app.schemas.ranking import RankingScenarioCreate, RankingScenarioResponse

router = APIRouter(prefix="/cases/{case_id}/ranking-scenarios", tags=["ranking"])

@router.post("", response_model=RankingScenarioResponse)
def create_ranking_scenario(case_id: str, scenario_in: RankingScenarioCreate) -> dict:
    """Mock endpoint to create a ranking scenario."""
    return {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "name": scenario_in.name,
        "weights": scenario_in.weights,
        "normalization_method": scenario_in.normalization_method,
        "created_at": datetime.utcnow(),
        "results": []
    }

@router.get("/{scenario_id}", response_model=RankingScenarioResponse)
def get_ranking_scenario(case_id: str, scenario_id: str) -> dict:
    """Mock endpoint to retrieve a ranking scenario."""
    return {
        "id": scenario_id,
        "case_id": case_id,
        "name": "Mocked Scenario",
        "weights": {"quality_score": 0.4, "delivery_reliability": 0.6},
        "normalization_method": "MIN_MAX_V1",
        "created_at": datetime.utcnow(),
        "results": [
            {
                "id": "result-1",
                "supplier_id": "sup-mock-1",
                "supplier_name": "Supplier A",
                "eligibility_result_id": "elig-1",
                "total_score": 85.5,
                "rank": 1,
                "ranking_version": "v1",
                "calculated_at": datetime.utcnow(),
                "score_components": []
            }
        ]
    }
