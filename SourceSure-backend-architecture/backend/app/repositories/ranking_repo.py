"""
Ranking repository — persistence for RankingScenario, RankingResult, and ScoreComponent.

Implements: create_scenario(), save_results(), get_scenario(),
            get_results_for_scenario().

Only PASS suppliers may appear in ranking results (Golden Rule — enforced
by the ranking service, Module 4.2).  This repository is responsible
solely for persistence; it does not enforce business rules.
"""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.models import RankingResult, RankingScenario, ScoreComponent

logger = logging.getLogger("sourcesure.repositories.ranking")


# ---------------------------------------------------------------------------
# Create — ranking scenario
# ---------------------------------------------------------------------------

def create_scenario(
    db: Session,
    *,
    case_id: str,
    name: str,
    weights: dict,
    normalization_method: str = "MIN_MAX_V1",
) -> RankingScenario:
    """
    Insert a new ranking scenario (weight configuration) for a case.

    Multiple scenarios can exist per case for sensitivity analysis
    (e.g. 'Quality First', 'Cost First', 'Balanced').

    Args:
        db: Active database session.
        case_id: UUID of the parent sourcing case.
        name: Descriptive scenario name.
        weights: Dict mapping requirement keys to float weights.
        normalization_method: Algorithm identifier (default: MIN_MAX_V1).

    Returns:
        The newly created RankingScenario ORM instance.
    """
    scenario = RankingScenario(
        case_id=case_id,
        name=name,
        weights=weights,
        normalization_method=normalization_method,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    logger.info(
        "ranking_scenario_created scenario_id=%s case_id=%s name=%s",
        scenario.id,
        case_id,
        name,
    )
    return scenario


# ---------------------------------------------------------------------------
# Save — ranking results with score components
# ---------------------------------------------------------------------------

def save_results(
    db: Session,
    results_data: List[dict],
) -> List[RankingResult]:
    """
    Persist ranking results and their score component breakdowns.

    Each dict in `results_data` must contain all RankingResult fields plus
    a `score_components` key with a list of ScoreComponent dicts.

    Transaction is committed atomically — either all results save or none.

    Args:
        db: Active database session.
        results_data: List of dicts, each with ranking result fields and
                      nested score_components list.

    Returns:
        List of newly created RankingResult ORM instances.
    """
    result_instances: List[RankingResult] = []

    for result_data in results_data:
        # --- Separate score components from the result data -----------------
        components_data = result_data.pop("score_components", [])

        # --- Create the ranking result record -------------------------------
        ranking_result = RankingResult(**result_data)
        db.add(ranking_result)
        db.flush()  # flush to get the generated ID before adding children

        # --- Create score component records ---------------------------------
        for comp_data in components_data:
            component = ScoreComponent(
                ranking_result_id=ranking_result.id,
                **comp_data,
            )
            db.add(component)

        result_instances.append(ranking_result)

    # --- Commit the full batch atomically -----------------------------------
    db.commit()
    for instance in result_instances:
        db.refresh(instance)

    logger.info("ranking_results_saved count=%d", len(result_instances))
    return result_instances


# ---------------------------------------------------------------------------
# Read — single scenario by ID
# ---------------------------------------------------------------------------

def get_scenario(
    db: Session,
    scenario_id: str,
) -> Optional[RankingScenario]:
    """
    Fetch a ranking scenario by its UUID.

    Returns:
        The RankingScenario instance, or None if not found.
    """
    return (
        db.query(RankingScenario)
        .filter(RankingScenario.id == scenario_id)
        .first()
    )


# ---------------------------------------------------------------------------
# Read — all results for a scenario
# ---------------------------------------------------------------------------

def get_results_for_scenario(
    db: Session,
    scenario_id: str,
) -> List[RankingResult]:
    """
    Retrieve all ranking results for a scenario, ordered by rank.

    Eagerly loads score_components via the ORM relationship so the
    service layer can serialize the full breakdown without N+1 queries.

    Returns:
        List of RankingResult ORM instances with loaded score_components.
    """
    return (
        db.query(RankingResult)
        .filter(RankingResult.scenario_id == scenario_id)
        .order_by(RankingResult.rank)
        .all()
    )
