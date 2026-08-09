"""
Eligibility Service — Module 3.1 & 3.2

Wires the deterministic eligibility evaluator to the functional database repositories.
Calculates eligibility for a supplier and updates their status to PASS, FAIL, or REVIEW.
"""

import logging
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.rules.evaluator import evaluate_requirement, EvidenceInput, RequirementInput
from app.rules.aggregator import aggregate_supplier_result
from app.repositories import case_repo, requirement_repo, evidence_repo, eligibility_repo, supplier_repo
from app.core.errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

def evaluate_supplier(db: Session, supplier_id: str, evaluation_date: date = None) -> str:
    """
    Evaluates a supplier against all mandatory requirements for their case.
    Saves EligibilityCheck records and the overall EligibilityResult.
    Updates the Supplier's status.
    
    Returns the final status (PASS, FAIL, REVIEW).
    """
    logger.info("Starting eligibility evaluation for supplier_id=%s", supplier_id)
    
    supplier = supplier_repo.get_by_id(db, supplier_id)
    if not supplier:
        raise ValueError(f"Supplier {supplier_id} not found")
        
    case = case_repo.get_by_id(db, supplier.case_id)
    if not evaluation_date:
        evaluation_date = case.evaluation_date or date.today()
        
    mandatory_reqs = requirement_repo.get_for_case(db, case.id, kind="MANDATORY")
    
    if not mandatory_reqs:
        # Config error: Sourcing case must have at least one mandatory requirement.
        raise AppError(
            code=ErrorCode.VALIDATION_ERROR,
            message=f"Eligibility cannot run because no mandatory requirements are configured for case {case.id}.",
            status_code=400
        )

    # Drop existing checks and results for this supplier (if any) to re-evaluate cleanly
    eligibility_repo.delete_for_supplier(db, supplier_id)

    checks_data = []
    for req in mandatory_reqs:
        # Fetch evidence for this specific requirement
        evidence_records = evidence_repo.get_for_requirement(db, supplier_id, req.key)
        
        evidence_inputs = [
            EvidenceInput(
                id=str(e.id),
                field_key=e.field_key,
                normalized_value=e.normalized_value,
                unit=e.unit,
                state=e.state,
                confidence=e.confidence
            )
            for e in evidence_records
        ]
        
        req_input = RequirementInput(
            id=str(req.id),
            key=req.key,
            label=req.label,
            value_type=req.value_type,
            operator=req.operator,
            target_value=req.target_value,
            unit=req.unit,
            allowed_values=req.allowed_values
        )
        
        # Run deterministic pure-function evaluator
        result = evaluate_requirement(req_input, evidence_inputs, evaluation_date)
        
        checks_data.append({
            "case_id": case.id,
            "supplier_id": supplier_id,
            "requirement_id": req.id,
            "status": result.status,
            "observed_value": result.observed_value,
            "observed_unit": result.observed_unit,
            "reason_code": result.reason_code,
            "explanation": result.explanation,
            "evidence_ids": result.evidence_ids,
            "rule_version": "v1.0"
        })
        
    checks = eligibility_repo.save_checks(db, checks_data)
    for check in checks:
        logger.debug("Check for req '%s' -> %s (%s)", check.requirement_id, check.status, check.reason_code)

    # Run pure-function aggregator
    # We must convert ORM models back to the domain model expected by the aggregator
    from app.rules.evaluator import EligibilityCheckResult
    domain_checks = [
        EligibilityCheckResult(
            status=c.status,
            reason_code=c.reason_code,
            explanation=c.explanation,
            observed_value=c.observed_value,
            observed_unit=c.observed_unit,
            evidence_ids=c.evidence_ids
        )
        for c in checks
    ]
    
    final_status = aggregate_supplier_result(domain_checks)
    
    # Save overall result
    eligibility_repo.save_result(
        db,
        case_id=case.id,
        supplier_id=supplier_id,
        status=final_status,
        check_ids=[c.id for c in checks],
        rule_version="v1.0"
    )
    
    # Update supplier status
    supplier_repo.update_status(db, supplier_id, final_status)
    
    logger.info("Supplier %s eligibility final status: %s", supplier_id, final_status)
    return final_status
