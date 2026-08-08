"""
Mocked API routes for Decisions.

Implements Module 1.4 specifications.
"""
from datetime import datetime

from fastapi import APIRouter

from app.schemas.decisions import DecisionSummaryResponse, HumanDecisionPatch

router = APIRouter(tags=["decisions"])

@router.post("/cases/{case_id}/decision-summaries", response_model=DecisionSummaryResponse)
def create_decision_summary(case_id: str) -> dict:
    """Mock endpoint to generate a decision summary via LLM."""
    return {
        "id": "dec-mock-1",
        "case_id": case_id,
        "scenario_id": "scen-mock-1",
        "recommended_supplier_id": "sup-mock-1",
        "generated_text": "Based on the evidence, Supplier A meets all mandatory requirements.",
        "assumptions": ["Supplier A capacity remains valid."],
        "limitations": ["Supplier C ISO certificate could not be verified."],
        "review_actions": ["Contact Supplier C for ISO 9001 clarification."],
        "human_decision": None,
        "human_decision_at": None,
        "created_at": datetime.utcnow(),
    }

@router.patch("/decision-summaries/{summary_id}/human-decision", response_model=DecisionSummaryResponse)
def patch_human_decision(summary_id: str, patch_in: HumanDecisionPatch) -> dict:
    """Mock endpoint to record the human decision."""
    return {
        "id": summary_id,
        "case_id": "case-mock-1",
        "scenario_id": "scen-mock-1",
        "recommended_supplier_id": "sup-mock-1",
        "generated_text": "Based on the evidence...",
        "assumptions": [],
        "limitations": [],
        "review_actions": [],
        "human_decision": patch_in.human_decision,
        "human_decision_at": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    }
