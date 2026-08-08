"""
Shared enums, error envelope, and generic response wrappers.

Every enum here mirrors a constrained `String` column in the ORM layer.
Using Python enums in schemas ensures that invalid values are rejected at
the API boundary before they ever touch the database or business logic.

This module has zero internal dependencies — it is safe to import from
every other schema file.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════════
# Domain Enums
# ═══════════════════════════════════════════════════════════════════════════


class RequirementKind(str, Enum):
    """Determines how a requirement is processed downstream."""
    MANDATORY = "MANDATORY"    # evaluated by the eligibility engine (Phase 3)
    PREFERENCE = "PREFERENCE"  # evaluated by the ranking engine (Phase 4)


class ValueType(str, Enum):
    """The data type expected for a requirement's target and observed values."""
    BOOLEAN = "BOOLEAN"
    NUMBER = "NUMBER"
    TEXT = "TEXT"
    DATE = "DATE"


class Operator(str, Enum):
    """Comparison operator used by the eligibility engine for mandatory checks."""
    EQ = "EQ"        # equals
    NE = "NE"        # not equals
    GT = "GT"        # greater than
    GTE = "GTE"      # greater than or equal
    LT = "LT"       # less than
    LTE = "LTE"      # less than or equal
    IN = "IN"        # value is in allowed_values list
    EXISTS = "EXISTS" # evidence exists (regardless of value)


class Direction(str, Enum):
    """Scoring direction for preference requirements in the ranking engine."""
    HIGHER_IS_BETTER = "HIGHER_IS_BETTER"
    LOWER_IS_BETTER = "LOWER_IS_BETTER"
    TARGET_IS_BEST = "TARGET_IS_BEST"      # Module 4.7 differentiator


class CaseStatus(str, Enum):
    """Lifecycle status of a sourcing case."""
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class SupplierStatus(str, Enum):
    """
    Eligibility status of a supplier.

    Golden Rule: only PASS suppliers may enter the ranking engine.
    """
    PENDING = "PENDING"
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"


class DocumentStatus(str, Enum):
    """Processing lifecycle of an uploaded document."""
    UPLOADED = "UPLOADED"
    PARSING = "PARSING"
    EXTRACTING = "EXTRACTING"
    READY = "READY"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    ERROR = "ERROR"


class ExtractionRunStatus(str, Enum):
    """Status of a single LLM extraction attempt."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"


class EvidenceState(str, Enum):
    """
    Validation state of an extracted evidence claim.

    LOW_CONFIDENCE and CONFLICTING both trigger REVIEW in eligibility;
    OVERRIDDEN evidence is excluded from all downstream evaluations.
    """
    SUPPORTED = "SUPPORTED"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    CONFLICTING = "CONFLICTING"
    OVERRIDDEN = "OVERRIDDEN"


class CheckStatus(str, Enum):
    """Result of a single eligibility check or overall supplier verdict."""
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"


class NormalizationMethod(str, Enum):
    """Algorithm used to normalize raw values into 0-100 scores."""
    MIN_MAX_V1 = "MIN_MAX_V1"


class ReasonCode(str, Enum):
    """
    Machine-readable reason for an eligibility check outcome.

    Each code maps to a specific branch in the evaluator logic (Module 3.1).
    """
    SATISFIED = "SATISFIED"                      # operator check passed
    CONTRADICTED = "CONTRADICTED"                # operator check failed
    MISSING_EVIDENCE = "MISSING_EVIDENCE"        # no evidence found → REVIEW
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE" # multiple conflicting values → REVIEW
    LOW_CONFIDENCE = "LOW_CONFIDENCE"            # confidence < 0.5 → REVIEW
    UNIT_MISMATCH = "UNIT_MISMATCH"              # unit not in conversion allowlist → REVIEW
    EXPIRED = "EXPIRED"                          # date-type cert past evaluation_date → REVIEW


# ═══════════════════════════════════════════════════════════════════════════
# Standard Error Envelope
# ═══════════════════════════════════════════════════════════════════════════


class ErrorDetail(BaseModel):
    """Inner body of the standard error response."""
    code: str = Field(..., description="Machine-readable error code from ErrorCode enum.")
    message: str = Field(..., description="Human-readable error description.")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional context.")
    request_id: str = Field(..., description="UUID for log correlation.")


class ErrorEnvelope(BaseModel):
    """
    Top-level error response shape returned by every endpoint on failure.

    Contract: `{"error": {"code", "message", "details", "request_id"}}`
    """
    error: ErrorDetail


# ═══════════════════════════════════════════════════════════════════════════
# Generic Paginated Response
# ═══════════════════════════════════════════════════════════════════════════

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic wrapper for list endpoints that may need pagination.

    Phase 1 uses this for consistency even though the demo fixture is small.
    """
    items: List[T]
    total: int = Field(..., ge=0, description="Total number of records matching the query.")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)
