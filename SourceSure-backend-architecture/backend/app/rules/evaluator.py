from dataclasses import dataclass
from datetime import date
from typing import Any, Optional

from app.rules.operators import OPERATOR_MAP
from app.rules.unit_converter import convert, UnitMismatchError

@dataclass
class EvidenceInput:
    id: str
    field_key: str
    normalized_value: Any
    unit: Optional[str]
    state: str
    confidence: float

@dataclass
class RequirementInput:
    id: str
    key: str
    label: str
    value_type: str
    operator: str
    target_value: Any
    unit: Optional[str]
    allowed_values: Optional[list] = None

@dataclass
class EligibilityCheckResult:
    status: str
    reason_code: str
    explanation: str
    observed_value: Any
    observed_unit: Optional[str]
    evidence_ids: list[str]

def _explain_satisfied(observed, unit, operator, target) -> str:
    u = f" {unit}" if unit else ""
    return f"{observed}{u} satisfies {operator} {target}{u}."

def _explain_contradicted(observed, unit, operator, target) -> str:
    u = f" {unit}" if unit else ""
    return f"{observed}{u} does not satisfy {operator} {target}{u}."

def evaluate_requirement(
    requirement: RequirementInput,
    evidence_list: list[EvidenceInput],
    evaluation_date: date,
) -> EligibilityCheckResult:
    
    active = [e for e in evidence_list if e.state != "OVERRIDDEN"]

    if not active:
        return EligibilityCheckResult(
            status="REVIEW",
            reason_code="MISSING_EVIDENCE",
            explanation=f"No evidence found for '{requirement.label}'. Human review required.",
            observed_value=None,
            observed_unit=None,
            evidence_ids=[],
        )

    if any(e.state == "CONFLICTING" for e in active):
        ids = [e.id for e in active if e.state == "CONFLICTING"]
        values = list({str(e.normalized_value) for e in active if e.state == "CONFLICTING"})
        return EligibilityCheckResult(
            status="REVIEW",
            reason_code="CONFLICTING_EVIDENCE",
            explanation=(f"Conflicting evidence for '{requirement.label}': "
                         f"values disagree across sources ({', '.join(values)}). Human review required."),
            observed_value=values,
            observed_unit=active[0].unit if active else None,
            evidence_ids=ids,
        )

    best = max(active, key=lambda e: e.confidence)
    if best.state == "LOW_CONFIDENCE":
        return EligibilityCheckResult(
            status="REVIEW",
            reason_code="LOW_CONFIDENCE",
            explanation=(f"Evidence for '{requirement.label}' has low confidence "
                         f"({best.confidence:.0%}). Human review required."),
            observed_value=best.normalized_value,
            observed_unit=best.unit,
            evidence_ids=[best.id],
        )

    if requirement.value_type == "DATE":
        try:
            evidence_date = date.fromisoformat(str(best.normalized_value))
            if evidence_date < evaluation_date:
                return EligibilityCheckResult(
                    status="FAIL",
                    reason_code="EXPIRED",
                    explanation=(f"'{requirement.label}' evidence dated {evidence_date} "
                                 f"is expired as of evaluation date {evaluation_date}."),
                    observed_value=str(evidence_date),
                    observed_unit=None,
                    evidence_ids=[best.id],
                )
        except (ValueError, TypeError):
            return EligibilityCheckResult(
                status="REVIEW",
                reason_code="UNSUPPORTED_TYPE",
                explanation=f"Cannot parse date value '{best.normalized_value}' for '{requirement.label}'.",
                observed_value=best.normalized_value,
                observed_unit=None,
                evidence_ids=[best.id],
            )

    observed_value = best.normalized_value
    observed_unit = best.unit

    if requirement.value_type == "NUMBER" and best.unit and requirement.unit:
        try:
            observed_value = convert(float(best.normalized_value), best.unit, requirement.unit)
            observed_unit = requirement.unit
        except UnitMismatchError as e:
            return EligibilityCheckResult(
                status="REVIEW",
                reason_code="UNIT_MISMATCH",
                explanation=str(e),
                observed_value=best.normalized_value,
                observed_unit=best.unit,
                evidence_ids=[best.id],
            )
        except (ValueError, TypeError):
            return EligibilityCheckResult(
                status="REVIEW",
                reason_code="UNSUPPORTED_TYPE",
                explanation=f"Cannot convert value '{best.normalized_value}' to float for numeric comparison.",
                observed_value=best.normalized_value,
                observed_unit=best.unit,
                evidence_ids=[best.id],
            )

    op_fn = OPERATOR_MAP.get(requirement.operator)
    if op_fn is None:
        return EligibilityCheckResult(
            status="REVIEW",
            reason_code="UNSUPPORTED_TYPE",
            explanation=f"Operator '{requirement.operator}' not supported.",
            observed_value=observed_value,
            observed_unit=observed_unit,
            evidence_ids=[best.id],
        )

    try:
        if requirement.operator == "IN":
            result = op_fn(observed_value, requirement.allowed_values or [])
        elif requirement.operator == "EXISTS":
            result = op_fn(observed_value)
        else:
            result = op_fn(observed_value, requirement.target_value)
    except (TypeError, ValueError) as e:
        return EligibilityCheckResult(
            status="REVIEW",
            reason_code="UNSUPPORTED_TYPE",
            explanation=f"Type error evaluating '{requirement.label}': {e}",
            observed_value=observed_value,
            observed_unit=observed_unit,
            evidence_ids=[best.id],
        )

    if result:
        return EligibilityCheckResult(
            status="PASS",
            reason_code="SATISFIED",
            explanation=_explain_satisfied(observed_value, observed_unit, requirement.operator, requirement.target_value),
            observed_value=observed_value,
            observed_unit=observed_unit,
            evidence_ids=[best.id],
        )
    else:
        return EligibilityCheckResult(
            status="FAIL",
            reason_code="CONTRADICTED",
            explanation=_explain_contradicted(observed_value, observed_unit, requirement.operator, requirement.target_value),
            observed_value=observed_value,
            observed_unit=observed_unit,
            evidence_ids=[best.id],
        )
