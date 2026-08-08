"""
Requirement schemas — create, read, and bulk-update.

Requirements define what the buyer needs from suppliers.  The `kind` field
splits them into two processing tracks:

  • MANDATORY → eligibility engine (Phase 3): operator + target_value
  • PREFERENCE → ranking engine (Phase 4): weight + direction

RequirementsUpdate replaces ALL requirements for a case in one atomic
operation (PUT semantics) to avoid partial-state consistency issues.
"""

from typing import Any, List, Optional

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import (
    Direction,
    Operator,
    RequirementKind,
    ValueType,
)


# ═══════════════════════════════════════════════════════════════════════════
# Request Schemas (inputs)
# ═══════════════════════════════════════════════════════════════════════════


class RequirementCreate(BaseModel):
    """
    Schema for a single requirement within a bulk update.

    Validation rules enforce that mandatory requirements carry an operator
    and target, while preferences carry a weight and direction.
    """
    key: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique machine-readable identifier (e.g. 'cnc_5axis', 'quality_score').",
    )
    label: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Human-readable display name.",
    )
    kind: RequirementKind
    value_type: ValueType

    # --- Mandatory-specific fields -------------------------------------------
    operator: Optional[Operator] = Field(
        default=None,
        description="Comparison operator — required for MANDATORY requirements.",
    )
    target_value: Optional[Any] = Field(
        default=None,
        description="The value the supplier must meet — required for MANDATORY requirements.",
    )
    unit: Optional[str] = Field(default=None, max_length=50)
    allowed_values: Optional[List[Any]] = Field(
        default=None,
        description="Valid value set — required when operator is IN.",
    )

    # --- Preference-specific fields ------------------------------------------
    weight: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Relative importance (0-1) — required for PREFERENCE requirements.",
    )
    direction: Optional[Direction] = Field(
        default=None,
        description="Scoring direction — required for PREFERENCE requirements.",
    )

    notes: Optional[str] = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _validate_kind_specific_fields(self) -> "RequirementCreate":
        """Enforce that mandatory vs preference requirements carry the right fields."""
        if self.kind == RequirementKind.MANDATORY:
            if self.operator is None:
                raise ValueError("MANDATORY requirements must specify an operator.")
            # EXISTS operator does not require a target_value
            if self.operator != Operator.EXISTS and self.target_value is None:
                raise ValueError("MANDATORY requirements must specify a target_value (unless operator is EXISTS).")
            # IN operator requires allowed_values
            if self.operator == Operator.IN and not self.allowed_values:
                raise ValueError("Operator IN requires a non-empty allowed_values list.")

        elif self.kind == RequirementKind.PREFERENCE:
            if self.weight is None:
                raise ValueError("PREFERENCE requirements must specify a weight.")
            if self.direction is None:
                raise ValueError("PREFERENCE requirements must specify a direction.")

        return self


class RequirementsUpdate(BaseModel):
    """
    Bulk replacement payload for PUT /cases/{case_id}/requirements.

    Replaces ALL requirements for the case atomically — partial updates
    are not supported to avoid partial-state consistency issues.
    """
    requirements: List[RequirementCreate] = Field(
        ...,
        min_length=1,
        description="Complete list of requirements — replaces any existing ones.",
    )

    @model_validator(mode="after")
    def _validate_unique_keys(self) -> "RequirementsUpdate":
        """Ensure no duplicate requirement keys within a single update."""
        keys = [r.key for r in self.requirements]
        if len(keys) != len(set(keys)):
            duplicates = [k for k in keys if keys.count(k) > 1]
            raise ValueError(f"Duplicate requirement keys detected: {set(duplicates)}")
        return self


# ═══════════════════════════════════════════════════════════════════════════
# Response Schemas (outputs)
# ═══════════════════════════════════════════════════════════════════════════


class RequirementResponse(BaseModel):
    """Full requirement as stored in the database."""
    id: str
    case_id: str
    key: str
    label: str
    kind: RequirementKind
    value_type: ValueType
    operator: Optional[Operator] = None
    target_value: Optional[Any] = None
    unit: Optional[str] = None
    allowed_values: Optional[List[Any]] = None
    weight: Optional[float] = None
    direction: Optional[Direction] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}
