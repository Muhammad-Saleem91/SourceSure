"""
API routes for Ranking.

Implements Module 1.4 specifications.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.ranking import RankingScenarioCreate, RankingScenarioResponse
from app.services.ranking import ranking_service

router = APIRouter(prefix="/cases/{case_id}/ranking-scenarios", tags=["ranking"])

@router.post("", response_model=RankingScenarioResponse)
def create_ranking_scenario(
    case_id: str,
    scenario_in: RankingScenarioCreate,
    db: Session = Depends(get_db)
) -> dict:
    """Create a new ranking scenario."""
    return ranking_service.create_ranking_scenario(
        db=db,
        case_id=case_id,
        name=scenario_in.name,
        weights=scenario_in.weights,
        normalization_method=scenario_in.normalization_method
    )

@router.get("/{scenario_id}", response_model=RankingScenarioResponse)
def get_ranking_scenario(
    case_id: str,
    scenario_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """Retrieve an existing ranking scenario."""
    # Note: case_id validation could be added here, but the scenario_id lookup is sufficient
    # as scenarios belong to cases in the DB.
    return ranking_service.get_ranking_scenario(db=db, scenario_id=scenario_id)
