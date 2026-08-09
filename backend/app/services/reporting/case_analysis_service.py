"""
Case Analysis Service — Module 5.2.

Responsible for computing the dynamic `CaseAnalysis` read model for a sourcing case.
It aggregates data across suppliers, documents, and requirements to generate
actionable warnings and determine pipeline readiness flags.

Business Rules (Phase 5 refinement):
  • `eligibility_ready` = True if ALL active suppliers have completed outcomes (PASS/FAIL/REVIEW).
  • `ranking_ready` = True if eligibility is ready AND at least one supplier passed.
  • `warnings` = Missing evidence, documents in error/review, suppliers needing review.
"""

import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import RankingScenario, SourcingCase, Supplier
from app.repositories import (
    document_repo,
    eligibility_repo,
    evidence_repo,
    requirement_repo,
    supplier_repo,
)
from app.schemas.cases import CaseAnalysis, CaseResponse, SupplierSnapshot

logger = logging.getLogger("sourcesure.services.reporting.case_analysis")


def get_case_analysis_read_model(db: Session, case: SourcingCase) -> CaseAnalysis:
    """
    Build the aggregate read model for the Case dashboard.

    Args:
        db: Active database session.
        case: The loaded SourcingCase ORM instance.

    Returns:
        A populated CaseAnalysis Pydantic model.
    """
    suppliers = supplier_repo.get_for_case(db, case.id)
    
    # --- 1. Build Supplier Snapshots -----------------------------------------
    snapshots = []
    for supplier in suppliers:
        docs = document_repo.get_for_supplier(db, supplier.id)
        has_evidence = any(len(evidence_repo.get_for_supplier(db, supplier.id)) > 0 for _ in [1]) # Check if they have *any* evidence. We just do a lightweight check.
        # A more precise check is to query if any evidence exists for this supplier id.
        # The repo method get_for_supplier(db, supplier_id) returns a list, so checking len > 0 is fine.
        evidence_records = evidence_repo.get_for_supplier(db, supplier.id)
        
        snapshots.append(
            SupplierSnapshot(
                id=supplier.id,
                name=supplier.name,
                status=supplier.status,
                document_count=len(docs),
                has_evidence=len(evidence_records) > 0,
            )
        )
    
    # --- 2. Compute Readiness Flags ------------------------------------------
    # eligibility_ready = True if all suppliers have a completed outcome
    # Active suppliers are those that exist. If no suppliers exist, it's not ready.
    if not suppliers:
        eligibility_ready = False
        ranking_ready = False
    else:
        completed_statuses = {"PASS", "FAIL", "REVIEW"}
        eligibility_ready = all(s.status in completed_statuses for s in suppliers)
        ranking_ready = eligibility_ready and any(s.status == "PASS" for s in suppliers)
    
    # --- 3. Compute Warnings -------------------------------------------------
    warnings = []
    
    for supplier in suppliers:
        # Warning: Supplier needs review
        if supplier.status == "REVIEW":
            warnings.append(f"Supplier '{supplier.name}' requires manual review.")
            
        # Warning: Documents need attention
        docs = document_repo.get_for_supplier(db, supplier.id)
        if any(d.status in ("NEEDS_REVIEW", "ERROR") for d in docs):
            warnings.append(f"Supplier '{supplier.name}' has documents requiring attention.")
            
    # Warning: Missing evidence for mandatory requirements
    requirements = requirement_repo.get_for_case(db, case.id)
    mandatory_reqs = [r for r in requirements if r.kind == "MANDATORY"]
    
    if mandatory_reqs and suppliers:
        evidence_counts = evidence_repo.get_evidence_counts_by_requirement(db, case.id)
        for req in mandatory_reqs:
            if evidence_counts.get(req.key, 0) == 0:
                warnings.append(f"No evidence found for requirement '{req.label}'.")
                
    # --- 4. Get Active Scenario ----------------------------------------------
    active_scenario_id: Optional[str] = None
    latest_scenario = (
        db.query(RankingScenario)
        .filter(RankingScenario.case_id == case.id)
        .order_by(RankingScenario.created_at.desc())
        .first()
    )
    if latest_scenario:
        active_scenario_id = latest_scenario.id

    return CaseAnalysis(
        case=CaseResponse.model_validate(case),
        suppliers=snapshots,
        eligibility_ready=eligibility_ready,
        ranking_ready=ranking_ready,
        warnings=warnings,
        active_scenario_id=active_scenario_id,
    )
