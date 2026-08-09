"""
Phase 3 Final Stabilization Gate - Golden Scenario Test
"""
import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base
from app.repositories import case_repo, requirement_repo, supplier_repo, document_repo, evidence_repo, eligibility_repo
from app.services.eligibility.eligibility_service import evaluate_supplier

# Use in-memory SQLite for the integration test
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

def test_golden_scenario():
    db = TestingSessionLocal()
    
    case = case_repo.create(db, name="Golden Scenario", description="Integration Test")
    
    # 2. Add Mandatory Requirements
    requirement_repo.replace_for_case(db, case.id, [
        {"key": "iso_9001", "label": "ISO 9001", "value_type": "BOOLEAN", "operator": "EQ", "target_value": True, "kind": "MANDATORY"},
        {"key": "lead_time", "label": "Lead Time", "value_type": "NUMBER", "operator": "LTE", "target_value": 30, "unit": "day", "kind": "MANDATORY"}
    ])
                                   
    # 3. Create Suppliers A, B, C
    sup_a = supplier_repo.create(db, case_id=case.id, name="Supplier A (Pass)")
    sup_b = supplier_repo.create(db, case_id=case.id, name="Supplier B (Fail)")
    sup_c = supplier_repo.create(db, case_id=case.id, name="Supplier C (Review/Conflict)")

    # 4. Inject Evidence directly (Mocking extraction output)
    # Supplier A: All PASS
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_a.id, "document_id": "doc1", "extraction_run_id": "run1", "field_key": "iso_9001", "raw_value": "yes", "normalized_value": True, "state": "SUPPORTED", "confidence": 0.95, "quoted_text": "Q1"},
        {"supplier_id": sup_a.id, "document_id": "doc1", "extraction_run_id": "run1", "field_key": "lead_time", "raw_value": "24 days", "normalized_value": 24, "unit": "day", "state": "SUPPORTED", "confidence": 0.95, "quoted_text": "Q2"}
    ])
    
    # Supplier B: FAIL on lead time
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_b.id, "document_id": "doc2", "extraction_run_id": "run2", "field_key": "iso_9001", "raw_value": "yes", "normalized_value": True, "state": "SUPPORTED", "confidence": 0.95, "quoted_text": "Q1"},
        {"supplier_id": sup_b.id, "document_id": "doc2", "extraction_run_id": "run2", "field_key": "lead_time", "raw_value": "45 days", "normalized_value": 45, "unit": "day", "state": "SUPPORTED", "confidence": 0.95, "quoted_text": "Q2"}
    ])

    # Supplier C: CONFLICTING on ISO 9001
    evidence_repo.create_batch(db, [
        {"supplier_id": sup_c.id, "document_id": "doc3", "extraction_run_id": "run3", "field_key": "iso_9001", "raw_value": "yes", "normalized_value": True, "state": "CONFLICTING", "confidence": 0.95, "quoted_text": "Q1"},
        {"supplier_id": sup_c.id, "document_id": "doc4", "extraction_run_id": "run4", "field_key": "iso_9001", "raw_value": "no", "normalized_value": False, "state": "CONFLICTING", "confidence": 0.95, "quoted_text": "Q2"},
        {"supplier_id": sup_c.id, "document_id": "doc3", "extraction_run_id": "run3", "field_key": "lead_time", "raw_value": "24 days", "normalized_value": 24, "unit": "day", "state": "SUPPORTED", "confidence": 0.95, "quoted_text": "Q3"}
    ])

    # 5. Run Eligibility Engine
    status_a = evaluate_supplier(db, sup_a.id)
    status_b = evaluate_supplier(db, sup_b.id)
    status_c = evaluate_supplier(db, sup_c.id)

    # 6. Verify Results
    assert status_a == "PASS"
    assert status_b == "FAIL"
    assert status_c == "REVIEW"

    # Verify Supplier statuses updated
    assert supplier_repo.get_by_id(db, sup_a.id).status == "PASS"
    assert supplier_repo.get_by_id(db, sup_b.id).status == "FAIL"
    assert supplier_repo.get_by_id(db, sup_c.id).status == "REVIEW"
    
    # Verify DB Checks
    checks_c = eligibility_repo.get_checks_for_supplier(db, sup_c.id)
    iso_check_c = next(c for c in checks_c if c.requirement.key == "iso_9001")
    assert iso_check_c.status == "REVIEW"
    assert iso_check_c.reason_code == "CONFLICTING_EVIDENCE"
    assert len(iso_check_c.evidence_ids) == 2  # The two conflicting records
    
    db.close()
