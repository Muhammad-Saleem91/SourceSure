"""
Decision Summary Service — Module 5.1a.

Orchestrates the Phase 5 decision summary pipeline:

  1. Idempotency check — return existing summary if one exists for the scenario.
  2. Load decision context from ranking, eligibility, and evidence repos.
  3. Compute ``recommended_supplier_id`` deterministically (rank == 1).
  4. Resolve decision-linked evidence ONLY — not all supplier evidence.
  5. Build structured LLM prompt via pure ``build_summary_context()``.
  6. Call ``LLMClient.generate_summary()`` — catch and translate failures.
  7. Persist via ``decision_repo.create()``.

SECURITY:
  • The LLM never decides who the recommended supplier is.
  • The context contains only evidence that actually caused the decision.
  • LLM failures are caught and mapped to ``AppError`` codes.
"""

import logging
from typing import Any, Dict, List, Optional, Set

from sqlalchemy.orm import Session

from app.ai.llm_client import LLMClient, LLMOutputInvalidError, LLMUnavailableError
from app.ai.summary_prompt import build_summary_context
from app.core.errors import AppError, ErrorCode
from app.db.models import (
    DecisionSummary,
    EligibilityCheck,
    Evidence,
    RankingResult,
    ScoreComponent,
)
from app.repositories import (
    case_repo,
    decision_repo,
    eligibility_repo,
    ranking_repo,
    supplier_repo,
)

logger = logging.getLogger("sourcesure.services.reporting.summary")


# ═══════════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════════


def generate_decision_summary(
    db: Session,
    case_id: str,
    scenario_id: str,
) -> DecisionSummary:
    """
    Generate an LLM-grounded decision advisory for a ranking scenario.

    The full pipeline:
      idempotency → load context → deterministic recommendation →
      resolve evidence → build prompt → LLM call → persist.

    Args:
        db: Active database session.
        case_id: UUID of the sourcing case.
        scenario_id: UUID of the ranking scenario.

    Returns:
        DecisionSummary ORM instance (new or existing if idempotent).

    Raises:
        AppError(NOT_FOUND): If case or scenario does not exist.
        AppError(LLM_UNAVAILABLE): If the LLM API call fails.
        AppError(EXTRACTION_INVALID_OUTPUT): If the LLM returns bad JSON.
    """
    # --- 1. Idempotency check ------------------------------------------------
    existing = _get_existing_summary(db, scenario_id)
    if existing is not None:
        logger.info(
            "idempotency_hit summary_id=%s scenario_id=%s",
            existing.id,
            scenario_id,
        )
        return existing

    # --- 2. Load and validate case and scenario ------------------------------
    case = case_repo.get_by_id(db, case_id)
    if case is None:
        raise AppError(
            code=ErrorCode.NOT_FOUND,
            message=f"Case '{case_id}' not found.",
            status_code=404,
        )

    scenario = ranking_repo.get_scenario(db, scenario_id)
    if scenario is None:
        raise AppError(
            code=ErrorCode.NOT_FOUND,
            message=f"Ranking scenario '{scenario_id}' not found.",
            status_code=404,
        )

    if scenario.case_id != case_id:
        raise AppError(
            code=ErrorCode.NOT_FOUND,
            message=f"Scenario '{scenario_id}' does not belong to case '{case_id}'.",
            status_code=404,
        )

    # --- 3. Load ranking results (ordered by rank) ---------------------------
    ranking_results = ranking_repo.get_results_for_scenario(db, scenario_id)

    # --- 4. Deterministic recommendation (rank == 1) -------------------------
    recommended_supplier_id: Optional[str] = None
    recommended_supplier_name: Optional[str] = None

    if ranking_results:
        rank_1 = ranking_results[0]  # already ordered by rank
        recommended_supplier_id = rank_1.supplier_id
        recommended_supplier_name = (
            rank_1.supplier.name if rank_1.supplier else None
        )

    # --- 5. Resolve decision-linked evidence only ----------------------------
    evidence_ids: Set[str] = set()
    ranking_breakdown = _build_ranking_breakdown(db, ranking_results, evidence_ids)
    excluded_suppliers = _build_excluded_suppliers(db, case_id, evidence_ids)
    decision_evidence = _load_evidence_by_ids(db, evidence_ids)

    # --- 6. Build LLM prompt context -----------------------------------------
    context_text = build_summary_context(
        case_name=case.name,
        scenario_name=scenario.name,
        recommended_supplier_name=recommended_supplier_name,
        recommended_supplier_id=recommended_supplier_id,
        ranking_breakdown=ranking_breakdown,
        excluded_suppliers=excluded_suppliers,
        decision_evidence=decision_evidence,
    )

    # --- 7. Call LLM ---------------------------------------------------------
    try:
        llm = LLMClient()
        summary_output = llm.generate_summary(context_text)
    except LLMUnavailableError as exc:
        logger.error(
            "llm_unavailable scenario_id=%s error=%s", scenario_id, exc
        )
        raise AppError(
            code=ErrorCode.LLM_UNAVAILABLE,
            message="LLM service is unavailable. Please try again later.",
            status_code=503,
        ) from exc
    except LLMOutputInvalidError as exc:
        logger.error(
            "llm_output_invalid scenario_id=%s error=%s", scenario_id, exc
        )
        raise AppError(
            code=ErrorCode.EXTRACTION_INVALID_OUTPUT,
            message="LLM returned an invalid summary response.",
            status_code=502,
        ) from exc

    # --- 8. Persist ----------------------------------------------------------
    decision_summary = decision_repo.create(
        db,
        case_id=case_id,
        scenario_id=scenario_id,
        recommended_supplier_id=recommended_supplier_id,
        generated_text=summary_output.generated_text,
        assumptions=summary_output.assumptions,
        limitations=summary_output.limitations,
        review_actions=summary_output.review_actions,
    )

    logger.info(
        "decision_summary_generated summary_id=%s case_id=%s scenario_id=%s "
        "recommended_supplier_id=%s",
        decision_summary.id,
        case_id,
        scenario_id,
        recommended_supplier_id,
    )
    return decision_summary


# ═══════════════════════════════════════════════════════════════════════════
# Internal Helpers
# ═══════════════════════════════════════════════════════════════════════════


def _get_existing_summary(
    db: Session,
    scenario_id: str,
) -> Optional[DecisionSummary]:
    """Check if a DecisionSummary already exists for this scenario (idempotency)."""
    return (
        db.query(DecisionSummary)
        .filter(DecisionSummary.scenario_id == scenario_id)
        .first()
    )


def _build_ranking_breakdown(
    db: Session,
    ranking_results: List[RankingResult],
    evidence_ids: Set[str],
) -> List[Dict[str, Any]]:
    """
    Build the ranking breakdown data structure for the LLM context.

    Collects evidence IDs from ScoreComponent.evidence_ids into the
    shared ``evidence_ids`` set so they can be loaded in bulk later.
    """
    breakdown: List[Dict[str, Any]] = []

    for result in ranking_results:
        components_data: List[Dict[str, Any]] = []
        for comp in result.score_components:
            comp_evidence = comp.evidence_ids or []
            evidence_ids.update(comp_evidence)

            # Resolve requirement label for context readability
            req_label = (
                comp.requirement.label if comp.requirement else comp.requirement_id
            )

            components_data.append({
                "requirement_label": req_label,
                "raw_value": comp.raw_value,
                "normalized_score": comp.normalized_score,
                "weight": comp.weight,
                "weighted_score": comp.weighted_score,
                "evidence_ids": comp_evidence,
            })

        breakdown.append({
            "rank": result.rank,
            "supplier_id": result.supplier_id,
            "supplier_name": result.supplier.name if result.supplier else "Unknown",
            "total_score": result.total_score,
            "score_components": components_data,
        })

    return breakdown


def _build_excluded_suppliers(
    db: Session,
    case_id: str,
    evidence_ids: Set[str],
) -> List[Dict[str, Any]]:
    """
    Build the excluded suppliers data for the LLM context.

    Loads eligibility checks for FAIL and REVIEW suppliers, and collects
    their evidence IDs into the shared set.
    """
    excluded: List[Dict[str, Any]] = []
    suppliers = supplier_repo.get_for_case(db, case_id)

    for supplier in suppliers:
        # --- Only include non-PASS suppliers ---------------------------------
        if supplier.status not in ("FAIL", "REVIEW"):
            continue

        # --- Get the eligibility checks that caused the outcome ---------------
        checks = eligibility_repo.get_checks_for_supplier(db, supplier.id)
        failing_checks_data: List[Dict[str, Any]] = []

        for check in checks:
            if check.status in ("FAIL", "REVIEW"):
                check_evidence = check.evidence_ids or []
                evidence_ids.update(check_evidence)

                req_label = (
                    check.requirement.label
                    if check.requirement
                    else check.requirement_id
                )

                failing_checks_data.append({
                    "requirement_label": req_label,
                    "status": check.status,
                    "reason_code": check.reason_code,
                    "evidence_ids": check_evidence,
                })

        excluded.append({
            "supplier_id": supplier.id,
            "supplier_name": supplier.name,
            "status": supplier.status,
            "failing_checks": failing_checks_data,
        })

    return excluded


def _load_evidence_by_ids(
    db: Session,
    evidence_ids: Set[str],
) -> List[Dict[str, Any]]:
    """
    Load the exact evidence records referenced by the decision trace.

    Returns a list of dicts with the fields the prompt context builder
    expects.  Only loads evidence that actually participated in ranking
    or eligibility — never the full supplier evidence table.
    """
    if not evidence_ids:
        return []

    records = (
        db.query(Evidence)
        .filter(Evidence.id.in_(list(evidence_ids)))
        .all()
    )

    return [
        {
            "id": ev.id,
            "field_key": ev.field_key,
            "raw_value": ev.raw_value,
            "normalized_value": ev.normalized_value,
            "state": ev.state,
            "confidence": ev.confidence,
            "quoted_text": ev.quoted_text or "",
            "document_id": ev.document_id,
            "page_number": ev.page_number,
            "sheet_name": ev.sheet_name,
        }
        for ev in records
    ]
