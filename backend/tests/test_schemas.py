import pytest
from pydantic import ValidationError

from app.schemas.requirements import RequirementCreate, RequirementsUpdate
from app.schemas.common import RequirementKind, ValueType, Operator, Direction

# ═══════════════════════════════════════════════════════════════════════════
# Schema Validation Tests
# ═══════════════════════════════════════════════════════════════════════════

def test_valid_mandatory_requirement():
    """Test creation of a valid mandatory requirement."""
    r = RequirementCreate(
        key="cnc_5axis", label="CNC 5-axis",
        kind=RequirementKind.MANDATORY, value_type=ValueType.BOOLEAN,
        operator=Operator.EQ, target_value=True,
    )
    assert r.key == "cnc_5axis"
    assert r.kind == RequirementKind.MANDATORY

def test_valid_preference_requirement():
    """Test creation of a valid preference requirement."""
    p = RequirementCreate(
        key="quality_score", label="Quality Score",
        kind=RequirementKind.PREFERENCE, value_type=ValueType.NUMBER,
        weight=0.4, direction=Direction.HIGHER_IS_BETTER,
    )
    assert p.key == "quality_score"
    assert p.kind == RequirementKind.PREFERENCE

def test_mandatory_missing_operator_fails():
    """Test that a mandatory requirement without an operator fails validation."""
    with pytest.raises(ValidationError):
        RequirementCreate(
            key="bad", label="Bad",
            kind=RequirementKind.MANDATORY, value_type=ValueType.BOOLEAN,
        )

def test_duplicate_keys_fails():
    """Test that RequirementsUpdate rejects duplicate requirement keys."""
    r = RequirementCreate(
        key="cnc_5axis", label="CNC 5-axis",
        kind=RequirementKind.MANDATORY, value_type=ValueType.BOOLEAN,
        operator=Operator.EQ, target_value=True,
    )
    with pytest.raises(ValidationError):
        RequirementsUpdate(requirements=[r, r])

def test_preference_missing_weight_fails():
    """Test that a preference requirement without a weight fails validation."""
    with pytest.raises(ValidationError):
        RequirementCreate(
            key="bad_pref", label="Bad Pref",
            kind=RequirementKind.PREFERENCE, value_type=ValueType.NUMBER,
            direction=Direction.HIGHER_IS_BETTER,
        )
