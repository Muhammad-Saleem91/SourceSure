import pytest
from datetime import date
from app.rules.evaluator import evaluate_requirement, EvidenceInput, RequirementInput, EligibilityCheckResult

def make_req(**kwargs) -> RequirementInput:
    defaults = dict(id="r1", key="lead_time_days", label="Lead Time",
                    value_type="NUMBER", operator="LTE", target_value=30,
                    unit="day", allowed_values=None)
    return RequirementInput(**{**defaults, **kwargs})

def make_ev(**kwargs) -> EvidenceInput:
    defaults = dict(id="e1", field_key="lead_time_days", normalized_value=24,
                    unit="day", state="SUPPORTED", confidence=0.95)
    return EvidenceInput(**{**defaults, **kwargs})

EVAL_DATE = date(2026, 8, 8)

def test_lte_pass_boundary():
    r = make_req(operator="LTE", target_value=30)
    e = make_ev(normalized_value=30)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "PASS"
    assert result.reason_code == "SATISFIED"

def test_lte_fail_over_boundary():
    r = make_req(operator="LTE", target_value=30)
    e = make_ev(normalized_value=31)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "FAIL"
    assert result.reason_code == "CONTRADICTED"

def test_gte_pass():
    r = make_req(operator="GTE", target_value=20000, key="capacity_monthly", label="Capacity")
    e = make_ev(normalized_value=25000, field_key="capacity_monthly")
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "PASS"

def test_gte_boundary_exact():
    r = make_req(operator="GTE", target_value=20000)
    e = make_ev(normalized_value=20000)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "PASS"

def test_eq_boolean_pass():
    r = make_req(operator="EQ", target_value=True, value_type="BOOLEAN",
                 key="iso_9001", label="ISO 9001")
    e = make_ev(normalized_value=True, field_key="iso_9001", unit=None)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "PASS"

def test_eq_boolean_fail():
    r = make_req(operator="EQ", target_value=True, value_type="BOOLEAN",
                 key="cnc_5axis", label="CNC 5-axis")
    e = make_ev(normalized_value=False, field_key="cnc_5axis", unit=None)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "FAIL"

def test_in_pass():
    r = make_req(operator="IN", target_value=None, value_type="STRING",
                 key="country", label="Country", allowed_values=["PK","CN","DE"])
    e = make_ev(normalized_value="PK", field_key="country", unit=None)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "PASS"

def test_in_fail():
    r = make_req(operator="IN", target_value=None, value_type="STRING",
                 key="country", label="Country", allowed_values=["PK","CN"])
    e = make_ev(normalized_value="US", field_key="country", unit=None)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "FAIL"

def test_missing_evidence_returns_review():
    r = make_req()
    result = evaluate_requirement(r, [], EVAL_DATE)
    assert result.status == "REVIEW"
    assert result.reason_code == "MISSING_EVIDENCE"

def test_low_confidence_returns_review():
    r = make_req()
    e = make_ev(state="LOW_CONFIDENCE", confidence=0.3)
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "REVIEW"
    assert result.reason_code == "LOW_CONFIDENCE"

def test_conflicting_evidence_returns_review():
    r = make_req()
    e1 = make_ev(id="e1", normalized_value=24, state="CONFLICTING")
    e2 = make_ev(id="e2", normalized_value=35, state="CONFLICTING")
    result = evaluate_requirement(r, [e1, e2], EVAL_DATE)
    assert result.status == "REVIEW"
    assert result.reason_code == "CONFLICTING_EVIDENCE"

def test_unit_conversion_weeks_to_days_pass():
    r = make_req(operator="LTE", target_value=30, unit="day")
    e = make_ev(normalized_value=3, unit="week")
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "PASS"
    assert result.observed_value == pytest.approx(21.0)

def test_unit_mismatch_returns_review():
    r = make_req(operator="LTE", target_value=30, unit="day")
    e = make_ev(normalized_value=30, unit="km")
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "REVIEW"
    assert result.reason_code == "UNIT_MISMATCH"

def test_expired_date_returns_fail():
    r = make_req(operator="EXISTS", value_type="DATE", key="iso_cert",
                 label="ISO Cert", target_value=None, unit=None)
    e = make_ev(normalized_value="2025-01-01", field_key="iso_cert",
                unit=None, state="SUPPORTED")
    result = evaluate_requirement(r, [e], EVAL_DATE)
    assert result.status == "FAIL"
    assert result.reason_code == "EXPIRED"

def test_overridden_evidence_ignored():
    r = make_req()
    e_old = make_ev(id="e1", normalized_value=50, state="OVERRIDDEN")
    e_new = make_ev(id="e2", normalized_value=24, state="SUPPORTED")
    result = evaluate_requirement(r, [e_old, e_new], EVAL_DATE)
    assert result.status == "PASS"
    assert result.evidence_ids == ["e2"]

from app.rules.aggregator import aggregate_supplier_result

def _check(status): return EligibilityCheckResult(
    status=status, reason_code="", explanation="",
    observed_value=None, observed_unit=None, evidence_ids=[])

def test_aggregate_all_pass():
    assert aggregate_supplier_result([_check("PASS"), _check("PASS")]) == "PASS"

def test_aggregate_one_fail():
    assert aggregate_supplier_result([_check("PASS"), _check("FAIL")]) == "FAIL"

def test_aggregate_one_review():
    assert aggregate_supplier_result([_check("PASS"), _check("REVIEW")]) == "REVIEW"

def test_aggregate_fail_beats_review():
    assert aggregate_supplier_result([_check("REVIEW"), _check("FAIL")]) == "FAIL"

def test_aggregate_empty():
    with pytest.raises(ValueError, match="Cannot aggregate empty checks"):
        aggregate_supplier_result([])
