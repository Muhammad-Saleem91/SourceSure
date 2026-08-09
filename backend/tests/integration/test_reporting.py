"""
Integration tests for Phase 5 (Module 5.5) — Reporting & Decision Summary.

Validates the Case Analysis read model logic (Module 5.2) and the
Decision Summary pipeline (Module 5.1).

Uses in-memory SQLite (via `db_session` fixture) and heavily mocks the LLM
to prevent external API calls and ensure deterministic testing.
"""

import pytest
from sqlalchemy.orm import Session

from app.ai.summary_schema import SummaryOutput
from app.db.models import (
    DecisionSummary,
    EligibilityCheck,
    EligibilityResult,
    Evidence,
    RankingResult,
    RankingScenario,
    SourcingCase,
    Supplier,
)
from app.repositories import (
    case_repo,
    decision_repo,
    eligibility_repo,
    ranking_repo,
    supplier_repo,
)
from app.services.reporting import case_analysis_service, summary_service


# ═══════════════════════════════════════════════════════════════════════════
# Fixtures for Seeding Test Data
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture
def seeded_case(db_session: Session) -> SourcingCase:
    """Creates a base case for testing."""
    return case_repo.create(db_session, name="Test Case", description="Integration Test Case")


@pytest.fixture
def seeded_suppliers(db_session: Session, seeded_case: SourcingCase) -> list[Supplier]:
    """Creates 2 suppliers: 1 PASS, 1 FAIL."""
    sup1 = supplier_repo.create(db_session, case_id=seeded_case.id, name="Supplier PASS")
    sup2 = supplier_repo.create(db_session, case_id=seeded_case.id, name="Supplier FAIL")
    
    # Manually update their statuses
    sup1.status = "PASS"
    sup2.status = "FAIL"
    db_session.commit()
    
    return [sup1, sup2]


@pytest.fixture
def seeded_scenario(db_session: Session, seeded_case: SourcingCase) -> RankingScenario:
    """Creates a ranking scenario for the case."""
    scenario = RankingScenario(
        case_id=seeded_case.id,
        name="Baseline",
        weights={"quality": 1.0},
    )
    db_session.add(scenario)
    db_session.commit()
    return scenario


@pytest.fixture
def seeded_ranking_result(db_session: Session, seeded_scenario: RankingScenario, seeded_suppliers: list[Supplier]) -> RankingResult:
    """Creates a rank 1 result for the PASS supplier."""
    sup_pass = [s for s in seeded_suppliers if s.status == "PASS"][0]
    
    # Must satisfy ForeignKey constraint on eligibility_results.id
    elig_result = EligibilityResult(
        case_id=seeded_scenario.case_id,
        supplier_id=sup_pass.id,
        status="PASS",
        rule_version="v1",
    )
    db_session.add(elig_result)
    db_session.commit()
    
    result = RankingResult(
        scenario_id=seeded_scenario.id,
        supplier_id=sup_pass.id,
        eligibility_result_id=elig_result.id,
        rank=1,
        total_score=100.0,
        ranking_version="v1",
        score_components=[],
    )
    db_session.add(result)
    db_session.commit()
    return result


# ═══════════════════════════════════════════════════════════════════════════
# Tests: Case Analysis Read Model (Module 5.2)
# ═══════════════════════════════════════════════════════════════════════════

def test_case_analysis_read_model(db_session: Session, seeded_case: SourcingCase, seeded_suppliers: list[Supplier]):
    """
    Test that the Case Analysis read model computes `eligibility_ready`
    and `ranking_ready` correctly based on supplier statuses.
    """
    # Act
    analysis = case_analysis_service.get_case_analysis_read_model(db_session, seeded_case)
    
    # Assert
    assert len(analysis.suppliers) == 2
    
    # Since we set one supplier to PASS and one to FAIL, all have terminal statuses.
    assert analysis.eligibility_ready is True
    # Since at least one passed, ranking is ready.
    assert analysis.ranking_ready is True
    
    # Let's change a supplier to PENDING and verify readiness drops
    sup_fail = [s for s in seeded_suppliers if s.status == "FAIL"][0]
    sup_fail.status = "PENDING"
    db_session.commit()
    
    analysis2 = case_analysis_service.get_case_analysis_read_model(db_session, seeded_case)
    assert analysis2.eligibility_ready is False
    assert analysis2.ranking_ready is False


# ═══════════════════════════════════════════════════════════════════════════
# Tests: Decision Summary (Module 5.1)
# ═══════════════════════════════════════════════════════════════════════════

def test_decision_summary_success(
    db_session: Session, 
    seeded_case: SourcingCase, 
    seeded_scenario: RankingScenario,
    seeded_ranking_result: RankingResult,
    monkeypatch,
):
    """
    Test the full happy path of generating a decision summary.
    Verifies that the deterministic recommended_supplier_id is pulled correctly.
    """
    # 1. Mock the LLM call to return a valid SummaryOutput
    mocked_output = SummaryOutput(
        generated_text="Mocked grounded narrative.",
        assumptions=["Assumption 1"],
        limitations=[],
        review_actions=[],
    )
    
    # We monkeypatch the LLMClient's generate_summary method
    call_count = 0
    def mock_generate_summary(self, context_text: str):
        nonlocal call_count
        call_count += 1
        # Assert that the deterministic supplier is in the context
        assert "Rank #1" in context_text
        return mocked_output

    from app.ai.llm_client import LLMClient
    monkeypatch.setattr(LLMClient, "generate_summary", mock_generate_summary)

    # 2. Act
    summary = summary_service.generate_decision_summary(
        db_session, case_id=seeded_case.id, scenario_id=seeded_scenario.id
    )

    # 3. Assert
    assert call_count == 1
    assert summary is not None
    assert summary.case_id == seeded_case.id
    assert summary.scenario_id == seeded_scenario.id
    assert summary.recommended_supplier_id == seeded_ranking_result.supplier_id
    assert summary.generated_text == "Mocked grounded narrative."


def test_decision_summary_idempotency(
    db_session: Session, 
    seeded_case: SourcingCase, 
    seeded_scenario: RankingScenario,
    seeded_ranking_result: RankingResult,
    monkeypatch,
):
    """
    Test that calling generate_decision_summary twice for the same scenario
    returns the exact same database record and DOES NOT call the LLM again.
    """
    # Mock LLM
    mocked_output = SummaryOutput(
        generated_text="Idempotency test.",
        assumptions=[],
        limitations=[],
        review_actions=[],
    )
    
    call_count = 0
    def mock_generate_summary(self, context_text: str):
        nonlocal call_count
        call_count += 1
        return mocked_output

    from app.ai.llm_client import LLMClient
    monkeypatch.setattr(LLMClient, "generate_summary", mock_generate_summary)

    # Act 1 (Creation)
    summary1 = summary_service.generate_decision_summary(
        db_session, case_id=seeded_case.id, scenario_id=seeded_scenario.id
    )
    
    # Act 2 (Idempotent fetch)
    summary2 = summary_service.generate_decision_summary(
        db_session, case_id=seeded_case.id, scenario_id=seeded_scenario.id
    )

    # Assert
    assert summary1.id == summary2.id
    assert call_count == 1  # The LLM was only called once!


def test_decision_summary_with_no_eligible_suppliers(
    db_session: Session, 
    seeded_case: SourcingCase, 
    seeded_scenario: RankingScenario,
    monkeypatch,
):
    """
    Test that if no suppliers pass (and thus no ranking results exist),
    the context string correctly sets recommended supplier to None and
    the pipeline completes gracefully.
    """
    # Notice: we are NOT injecting `seeded_ranking_result` here.
    
    # Mock LLM
    mocked_output = SummaryOutput(
        generated_text="No suppliers passed.",
        assumptions=[],
        limitations=[],
        review_actions=[],
    )
    
    def mock_generate_summary(self, context_text: str):
        # Verify the context builder correctly handled the None scenario
        assert "RECOMMENDED SUPPLIER: None — no suppliers passed" in context_text
        return mocked_output

    from app.ai.llm_client import LLMClient
    monkeypatch.setattr(LLMClient, "generate_summary", mock_generate_summary)

    # Act
    summary = summary_service.generate_decision_summary(
        db_session, case_id=seeded_case.id, scenario_id=seeded_scenario.id
    )

    # Assert
    assert summary.recommended_supplier_id is None
    assert summary.generated_text == "No suppliers passed."

