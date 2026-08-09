"""
Ranking service — Module 4.2.

Orchestrates the Phase 4 Ranking Engine pipeline.
Enforces the PASS-only eligibility gate, gathers Preference evidence,
applies Min-Max normalization and weighted scoring via the `ranker` module,
and persists the final deterministic RankingScenario.
"""

import logging
from typing import Dict, List, Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories import (
    case_repo,
    eligibility_repo,
    evidence_repo,
    ranking_repo,
    requirement_repo,
    supplier_repo,
)
from app.rules import ranker

logger = logging.getLogger("sourcesure.services.ranking")


def create_ranking_scenario(
    db: Session,
    case_id: str,
    name: str,
    weights: Dict[str, float],
    normalization_method: str = "MIN_MAX_V1",
) -> Any:
    """
    Execute the deterministic ranking pipeline.

    1. Enforce PASS-only gate.
    2. Gather preference evidence.
    3. Calculate min-max normalization.
    4. Apply weights.
    5. Rank deterministically.
    6. Persist results with evidence trace.
    """
    case = case_repo.get_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Fetch preference requirements
    all_reqs = requirement_repo.get_for_case(db, case_id)
    pref_reqs = [r for r in all_reqs if r.kind == "PREFERENCE"]
    pref_map = {r.key: r for r in pref_reqs}

    # Normalize weights to sum to 1.0 (if they don't already)
    total_weight = sum(weights.values())
    if total_weight <= 0:
        raise HTTPException(status_code=400, detail="Total weight must be positive")
    
    normalized_weights = {k: v / total_weight for k, v in weights.items()}

    # Validate weights correspond to real PREFERENCE requirements
    for k in normalized_weights.keys():
        if k not in pref_map:
            raise HTTPException(status_code=400, detail=f"Weight key '{k}' is not a PREFERENCE requirement.")

    # -------------------------------------------------------------------------
    # 1. PASS-Only Gate
    # -------------------------------------------------------------------------
    all_suppliers = supplier_repo.get_for_case(db, case_id)
    eligible_suppliers = []
    eligibility_results_map = {}

    for supplier in all_suppliers:
        elig_result = eligibility_repo.get_latest_for_supplier(db, case_id, supplier.id)
        if elig_result and elig_result.status == "PASS":
            eligible_suppliers.append(supplier)
            eligibility_results_map[supplier.id] = elig_result.id

    if not eligible_suppliers:
        # No PASS suppliers available. Return empty scenario.
        scenario = ranking_repo.create_scenario(
            db, case_id=case_id, name=name, weights=normalized_weights, normalization_method=normalization_method
        )
        return scenario

    # -------------------------------------------------------------------------
    # 2. Gather Preference Evidence
    # -------------------------------------------------------------------------
    supplier_raw_values: Dict[str, Dict[str, dict]] = {s.id: {} for s in eligible_suppliers}
    
    # Structure: min_max_bounds[req_key] = {"min": float, "max": float}
    min_max_bounds: Dict[str, dict] = {}

    for req_key, req in pref_map.items():
        if req_key not in normalized_weights:
            continue
            
        vals = []
        for supplier in eligible_suppliers:
            # Fetch evidence for this requirement
            ev_list = evidence_repo.get_for_requirement(db, supplier.id, req_key)
            supported_ev = [e for e in ev_list if e.state == "SUPPORTED"]
            
            raw_val = 0.0
            evidence_ids = []
            
            if supported_ev:
                # Use the latest supported evidence
                latest_ev = supported_ev[-1]
                evidence_ids.append(latest_ev.id)
                # Try to extract a numeric value
                if isinstance(latest_ev.normalized_value, (int, float)):
                    raw_val = float(latest_ev.normalized_value)
                else:
                    try:
                        raw_val = float(latest_ev.raw_value)
                    except ValueError:
                        raw_val = 0.0
                        
            supplier_raw_values[supplier.id][req_key] = {
                "raw_value": raw_val,
                "evidence_ids": evidence_ids
            }
            vals.append(raw_val)

        if vals:
            min_max_bounds[req_key] = {"min": min(vals), "max": max(vals)}
        else:
            min_max_bounds[req_key] = {"min": 0.0, "max": 0.0}

    # -------------------------------------------------------------------------
    # 3. Min-Max Normalization & Weighted Scoring
    # -------------------------------------------------------------------------
    results_data = []

    for supplier in eligible_suppliers:
        total_score = 0.0
        components_data = []

        for req_key, req in pref_map.items():
            if req_key not in normalized_weights:
                continue

            weight = normalized_weights[req_key]
            supplier_data = supplier_raw_values[supplier.id][req_key]
            raw_value = supplier_data["raw_value"]
            evidence_ids = supplier_data["evidence_ids"]
            
            min_val = min_max_bounds[req_key]["min"]
            max_val = min_max_bounds[req_key]["max"]
            
            # Normalize
            direction = req.direction or "HIGHER_IS_BETTER"
            normalized_score = ranker.normalize_min_max(raw_value, min_val, max_val, direction)
            
            # Weight
            weighted_contribution = ranker.calculate_weighted_score(normalized_score, weight)
            total_score += weighted_contribution
            
            components_data.append({
                "requirement_id": req.id,
                "raw_value": raw_value,
                "normalized_score": normalized_score,
                "weight": weight,
                "weighted_score": weighted_contribution,
                "evidence_ids": evidence_ids
            })

        results_data.append({
            "supplier_id": supplier.id,
            "supplier_name": supplier.name,  # for deterministic sorting
            "eligibility_result_id": eligibility_results_map[supplier.id],
            "total_score": round(total_score, 4),
            "ranking_version": "v1",
            "score_components": components_data
        })

    # -------------------------------------------------------------------------
    # 4. Rank Deterministically
    # -------------------------------------------------------------------------
    results_data = ranker.assign_ranks(results_data)

    # -------------------------------------------------------------------------
    # 5. Persist Scenario and Results
    # -------------------------------------------------------------------------
    scenario = ranking_repo.create_scenario(
        db,
        case_id=case_id,
        name=name,
        weights=normalized_weights,
        normalization_method=normalization_method
    )

    # Inject scenario_id before saving
    for result in results_data:
        result["scenario_id"] = scenario.id
        # Remove helper field used for sorting
        result.pop("supplier_name", None)

    ranking_repo.save_results(db, results_data)
    
    # Reload scenario to get eager relationships
    return ranking_repo.get_scenario(db, scenario.id)


def get_ranking_scenario(db: Session, scenario_id: str) -> Any:
    """Fetch an existing scenario."""
    scenario = ranking_repo.get_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Ranking scenario not found")
    return scenario
