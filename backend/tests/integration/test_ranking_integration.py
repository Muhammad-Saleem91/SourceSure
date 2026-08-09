"""
Integration test for Phase 4 Ranking Engine.
Proves the Golden Scenario, PASS-only gating, and decision tracing.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Supplier, Requirement, Evidence
from app.repositories import case_repo, requirement_repo, supplier_repo, evidence_repo, ranking_repo
from app.services.eligibility.eligibility_service import evaluate_supplier
from app.services.ranking.ranking_service import create_ranking_scenario

# Use in-memory SQLite for the integration test
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

def test_ranking_golden_scenario():
    db = TestingSessionLocal()
    
    # 1. Create Case
    case = case_repo.create(db, name="Ranking Golden Scenario", description="Integration Test")
    
    # 2. Add Requirements (Mandatory + Preference)
    requirement_repo.replace_for_case(db, case.id, [
        {"key": "iso_9001", "label": "ISO 9001", "value_type": "BOOLEAN", "operator": "EQ", "target_value": True, "kind": "MANDATORY"},
        {"key": "quality_score", "label": "Quality", "value_type": "NUMBER", "kind": "PREFERENCE", "direction": "HIGHER_IS_BETTER"},
        {"key": "delivery_reliability", "label": "Delivery", "value_type": "NUMBER", "kind": "PREFERENCE", "direction": "HIGHER_IS_BETTER"}
    ])
    
    # 3. Create Suppliers A, B, C, D
    sup_a = supplier_repo.create(db, case_id=case.id, name="Supplier A")
    sup_b = supplier_repo.create(db, case_id=case.id, name="Supplier B (Clean)")
    sup_c = supplier_repo.create(db, case_id=case.id, name="Supplier C v2")
    sup_d = supplier_repo.create(db, case_id=case.id, name="Supplier D")

    # 4. Inject Evidence
    # A -> PASS. Quality=88, Delivery=92
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_a.id, "document_id": "doc1", "extraction_run_id": "run1", "field_key": "iso_9001", "raw_value": "yes", "normalized_value": True, "state": "SUPPORTED", "confidence": 0.95},
        {"supplier_id": sup_a.id, "document_id": "doc1", "extraction_run_id": "run1", "field_key": "quality_score", "raw_value": "88", "normalized_value": 88, "state": "SUPPORTED", "confidence": 0.95},
        {"supplier_id": sup_a.id, "document_id": "doc1", "extraction_run_id": "run1", "field_key": "delivery_reliability", "raw_value": "92", "normalized_value": 92, "state": "SUPPORTED", "confidence": 0.95}
    ])
    
    # B -> FAIL. 
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_b.id, "document_id": "doc2", "extraction_run_id": "run2", "field_key": "iso_9001", "raw_value": "no", "normalized_value": False, "state": "SUPPORTED", "confidence": 0.95},
        # B's preference data should be ignored anyway, but we can supply it.
        {"supplier_id": sup_b.id, "document_id": "doc2", "extraction_run_id": "run2", "field_key": "quality_score", "raw_value": "99", "normalized_value": 99, "state": "SUPPORTED", "confidence": 0.95},
    ])
    
    # C -> REVIEW (CONFLICTING)
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_c.id, "document_id": "doc3", "extraction_run_id": "run3", "field_key": "iso_9001", "raw_value": "yes", "normalized_value": True, "state": "CONFLICTING", "confidence": 0.95},
        {"supplier_id": sup_c.id, "document_id": "doc4", "extraction_run_id": "run4", "field_key": "iso_9001", "raw_value": "no", "normalized_value": False, "state": "CONFLICTING", "confidence": 0.95}
    ])
    
    # D -> PASS. Quality=94, Delivery=84
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_d.id, "document_id": "doc5", "extraction_run_id": "run5", "field_key": "iso_9001", "raw_value": "yes", "normalized_value": True, "state": "SUPPORTED", "confidence": 0.95},
        {"supplier_id": sup_d.id, "document_id": "doc5", "extraction_run_id": "run5", "field_key": "quality_score", "raw_value": "94", "normalized_value": 94, "state": "SUPPORTED", "confidence": 0.95},
        {"supplier_id": sup_d.id, "document_id": "doc5", "extraction_run_id": "run5", "field_key": "delivery_reliability", "raw_value": "84", "normalized_value": 84, "state": "SUPPORTED", "confidence": 0.95}
    ])

    # 5. Run Eligibility Engine
    evaluate_supplier(db, sup_a.id)
    evaluate_supplier(db, sup_b.id)
    evaluate_supplier(db, sup_c.id)
    evaluate_supplier(db, sup_d.id)

    # 6. Run Ranking Baseline
    baseline = create_ranking_scenario(
        db=db,
        case_id=case.id,
        name="Baseline",
        weights={"quality_score": 0.4, "delivery_reliability": 0.6},
        normalization_method="MIN_MAX_V1"
    )

    # Verify Baseline Scenario is saved
    assert baseline.id is not None
    assert len(baseline.ranking_results) == 2  # Only A and D

    # Sort results by rank
    results = sorted(baseline.ranking_results, key=lambda x: x.rank)
    
    # A should be rank 1 with score 60, D rank 2 with score 40
    # A Quality = 88 (norm=0) -> 0 * 0.4 = 0
    # A Delivery = 92 (norm=100) -> 100 * 0.6 = 60. Total 60.
    assert results[0].supplier.name == "Supplier A"
    assert results[0].total_score == 60.0
    assert results[0].rank == 1

    # D Quality = 94 (norm=100) -> 100 * 0.4 = 40
    # D Delivery = 84 (norm=0) -> 0 * 0.6 = 0. Total 40.
    assert results[1].supplier.name == "Supplier D"
    assert results[1].total_score == 40.0
    assert results[1].rank == 2

    # Verify Transparency (Decision Trace)
    # Get A's delivery component
    a_delivery_comp = next(c for c in results[0].score_components if c.requirement.key == "delivery_reliability")
    assert a_delivery_comp.raw_value == 92.0
    assert a_delivery_comp.normalized_score == 100.0
    assert a_delivery_comp.weighted_score == 60.0
    assert len(a_delivery_comp.evidence_ids) == 1  # Successfully traced to the exact Evidence record!

    # 7. Run Ranking Sensitivity
    sensitivity = create_ranking_scenario(
        db=db,
        case_id=case.id,
        name="Sensitivity",
        weights={"quality_score": 0.7, "delivery_reliability": 0.3},
        normalization_method="MIN_MAX_V1"
    )

    assert sensitivity.id != baseline.id
    results_sens = sorted(sensitivity.ranking_results, key=lambda x: x.rank)

    # D should now be rank 1 with score 70, A rank 2 with score 30
    assert results_sens[0].supplier.name == "Supplier D"
    assert results_sens[0].total_score == 70.0
    
    assert results_sens[1].supplier.name == "Supplier A"
    assert results_sens[1].total_score == 30.0

    db.close()
