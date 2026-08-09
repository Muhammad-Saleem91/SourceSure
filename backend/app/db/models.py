"""
ORM entity definitions — Phase 1, Module 1.1.

All 12 domain tables for the SourceSure system.  Every model inherits from
the shared `Base` in `app.db.session` and follows these invariants:

  • Primary key: `id` — UUID string, server-generated via uuid4.
  • Timestamps: `created_at` (insert-time) and `updated_at` (auto-bumped).
  • Foreign keys: explicit `ondelete` on every FK column.
  • JSON columns: `sa.JSON` for flexible / list-shaped attributes.
  • Relationships: bidirectional with `back_populates` for ORM navigation.

Import this module *before* `Base.metadata.create_all()` so SQLAlchemy
registers the tables — `app/main.py` does this in its startup event.
"""

import uuid
from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.orm import relationship

from app.db.session import Base


# ---------------------------------------------------------------------------
# Helper: reusable column factories
# ---------------------------------------------------------------------------

def _uuid_pk() -> sa.Column:
    """Standard UUID primary key — string-stored, auto-generated."""
    return sa.Column(
        sa.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )


def _created_at() -> sa.Column:
    """Immutable insert timestamp."""
    return sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)


def _updated_at() -> sa.Column:
    """Auto-bumped on every flush."""
    return sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


# ═══════════════════════════════════════════════════════════════════════════
# 1. SOURCING CASE — top-level aggregate root
# ═══════════════════════════════════════════════════════════════════════════

class SourcingCase(Base):
    """
    A sourcing evaluation session (e.g. "Aluminum Motor Housing Q3 2026").

    Owns requirements, suppliers, eligibility results, ranking scenarios,
    and decision summaries.  Status transitions: DRAFT → ACTIVE → COMPLETED.
    """
    __tablename__ = "sourcing_cases"

    id = _uuid_pk()
    name = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    evaluation_date = sa.Column(sa.Date, nullable=True)
    status = sa.Column(sa.String(20), nullable=False, default="DRAFT")
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships (one-to-many) ----------------------------------------
    requirements = relationship(
        "Requirement", back_populates="case", cascade="all, delete-orphan"
    )
    suppliers = relationship(
        "Supplier", back_populates="case", cascade="all, delete-orphan"
    )
    eligibility_checks = relationship(
        "EligibilityCheck", back_populates="case", cascade="all, delete-orphan"
    )
    eligibility_results = relationship(
        "EligibilityResult", back_populates="case", cascade="all, delete-orphan"
    )
    ranking_scenarios = relationship(
        "RankingScenario", back_populates="case", cascade="all, delete-orphan"
    )
    decision_summaries = relationship(
        "DecisionSummary", back_populates="case", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 2. REQUIREMENT — what the buyer needs from suppliers
# ═══════════════════════════════════════════════════════════════════════════

class Requirement(Base):
    """
    A single evaluation criterion within a sourcing case.

    `kind` determines how the requirement is used downstream:
      • MANDATORY  → feeds the eligibility engine (Phase 3).
      • PREFERENCE → feeds the ranking engine (Phase 4).

    `operator` + `target_value` define the pass/fail rule for mandatory
    requirements; `weight` + `direction` define scoring for preferences.
    """
    __tablename__ = "requirements"

    id = _uuid_pk()
    case_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("sourcing_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key = sa.Column(sa.String(100), nullable=False)
    label = sa.Column(sa.String(255), nullable=False)
    kind = sa.Column(sa.String(20), nullable=False)          # MANDATORY | PREFERENCE
    value_type = sa.Column(sa.String(20), nullable=False)    # BOOLEAN | NUMBER | TEXT | DATE
    operator = sa.Column(sa.String(10), nullable=True)       # EQ, NE, GT, GTE, LT, LTE, IN, EXISTS
    target_value = sa.Column(sa.JSON, nullable=True)         # JSON to support bool/number/string/list
    unit = sa.Column(sa.String(50), nullable=True)
    allowed_values = sa.Column(sa.JSON, nullable=True)       # for IN operator
    weight = sa.Column(sa.Float, nullable=True)              # preference only
    direction = sa.Column(sa.String(20), nullable=True)      # HIGHER_IS_BETTER | LOWER_IS_BETTER | TARGET_IS_BEST
    notes = sa.Column(sa.Text, nullable=True)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    case = relationship("SourcingCase", back_populates="requirements")
    eligibility_checks = relationship(
        "EligibilityCheck", back_populates="requirement", cascade="all, delete-orphan"
    )
    score_components = relationship(
        "ScoreComponent", back_populates="requirement", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 3. SUPPLIER — a candidate being evaluated
# ═══════════════════════════════════════════════════════════════════════════

class Supplier(Base):
    """
    A supplier under evaluation for a given sourcing case.

    `status` is updated by the eligibility engine:
      PENDING → PASS | FAIL | REVIEW
    Only PASS suppliers are eligible for ranking (the Golden Rule).
    """
    __tablename__ = "suppliers"

    id = _uuid_pk()
    case_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("sourcing_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = sa.Column(sa.String(255), nullable=False)
    external_ref = sa.Column(sa.String(100), nullable=True)
    country = sa.Column(sa.String(10), nullable=True)
    status = sa.Column(sa.String(20), nullable=False, default="PENDING")
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    case = relationship("SourcingCase", back_populates="suppliers")
    documents = relationship(
        "Document", back_populates="supplier", cascade="all, delete-orphan"
    )
    evidence = relationship(
        "Evidence", back_populates="supplier", cascade="all, delete-orphan"
    )
    eligibility_checks = relationship(
        "EligibilityCheck", back_populates="supplier", cascade="all, delete-orphan"
    )
    eligibility_results = relationship(
        "EligibilityResult", back_populates="supplier", cascade="all, delete-orphan"
    )
    ranking_results = relationship(
        "RankingResult", back_populates="supplier", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 4. DOCUMENT — an uploaded file belonging to a supplier
# ═══════════════════════════════════════════════════════════════════════════

class Document(Base):
    """
    A file uploaded for a supplier (PDF, XLSX, DOCX, CSV).

    Lifecycle:  UPLOADED → PARSING → EXTRACTING → READY | NEEDS_REVIEW | ERROR

    `stored_path` uses a server-generated UUID filename to prevent path
    traversal attacks.  `sha256` enables deduplication and cache-busting.
    """
    __tablename__ = "documents"

    id = _uuid_pk()
    supplier_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    display_name = sa.Column(sa.String(500), nullable=False)
    stored_path = sa.Column(sa.String(1000), nullable=False)
    mime_type = sa.Column(sa.String(100), nullable=False)
    sha256 = sa.Column(sa.String(64), nullable=False)
    status = sa.Column(sa.String(20), nullable=False, default="UPLOADED")
    page_count = sa.Column(sa.Integer, nullable=True)
    uploaded_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    error_code = sa.Column(sa.String(50), nullable=True)
    error_message = sa.Column(sa.Text, nullable=True)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    supplier = relationship("Supplier", back_populates="documents")
    extraction_runs = relationship(
        "ExtractionRun", back_populates="document", cascade="all, delete-orphan"
    )
    evidence = relationship(
        "Evidence", back_populates="document", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 5. EXTRACTION RUN — a single LLM extraction attempt on a document
# ═══════════════════════════════════════════════════════════════════════════

class ExtractionRun(Base):
    """
    Records one invocation of the LLM extraction pipeline against a document.

    Tracks model version, prompt version, and schema version so extraction
    results are fully reproducible.  Same (hash, prompt, schema) → reuse.
    """
    __tablename__ = "extraction_runs"

    id = _uuid_pk()
    document_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model = sa.Column(sa.String(100), nullable=False)
    prompt_version = sa.Column(sa.String(20), nullable=False)
    schema_version = sa.Column(sa.String(20), nullable=False)
    status = sa.Column(sa.String(20), nullable=False, default="PENDING")
    started_at = sa.Column(sa.DateTime, nullable=True)
    completed_at = sa.Column(sa.DateTime, nullable=True)
    error = sa.Column(sa.Text, nullable=True)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    document = relationship("Document", back_populates="extraction_runs")
    evidence = relationship(
        "Evidence", back_populates="extraction_run", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 6. EVIDENCE — a single extracted claim from a document
# ═══════════════════════════════════════════════════════════════════════════

class Evidence(Base):
    """
    An atomic fact extracted by the LLM from a supplier document.

    Every piece of evidence carries a full citation chain back to the
    source document (page_number, sheet_name, cell_range, section, quoted_text)
    so that downstream decisions are always traceable.

    `state` values:
      • SUPPORTED       — high-confidence, validated claim
      • LOW_CONFIDENCE   — confidence < 0.5 threshold → triggers REVIEW
      • CONFLICTING      — same field, different value from another document
      • OVERRIDDEN       — manually superseded (excluded from evaluations)
    """
    __tablename__ = "evidence"

    id = _uuid_pk()
    supplier_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    extraction_run_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("extraction_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Extracted data -------------------------------------------------------
    field_key = sa.Column(sa.String(100), nullable=False, index=True)
    raw_value = sa.Column(sa.Text, nullable=False)
    normalized_value = sa.Column(sa.JSON, nullable=True)    # canonical typed value
    unit = sa.Column(sa.String(50), nullable=True)
    state = sa.Column(sa.String(20), nullable=False, default="SUPPORTED")
    confidence = sa.Column(sa.Float, nullable=False, default=0.0)

    # --- Citation chain (traceability mandate) --------------------------------
    quoted_text = sa.Column(sa.Text, nullable=True)
    page_number = sa.Column(sa.Integer, nullable=True)
    sheet_name = sa.Column(sa.String(255), nullable=True)
    cell_range = sa.Column(sa.String(50), nullable=True)
    section = sa.Column(sa.String(255), nullable=True)
    provenance_method = sa.Column(sa.String(50), nullable=True)
    validation_reason = sa.Column(sa.String(50), nullable=True)

    retrieval_date = sa.Column(sa.Date, nullable=True)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    supplier = relationship("Supplier", back_populates="evidence")
    document = relationship("Document", back_populates="evidence")
    extraction_run = relationship("ExtractionRun", back_populates="evidence")


# ═══════════════════════════════════════════════════════════════════════════
# 7. ELIGIBILITY CHECK — one requirement evaluated for one supplier
# ═══════════════════════════════════════════════════════════════════════════

class EligibilityCheck(Base):
    """
    Result of evaluating a single mandatory requirement against a supplier's
    evidence.  Produced by the deterministic rule engine (Phase 3) —
    never by the LLM.

    `reason_code` values: SATISFIED, CONTRADICTED, MISSING_EVIDENCE,
    CONFLICTING_EVIDENCE, LOW_CONFIDENCE, UNIT_MISMATCH, EXPIRED.
    """
    __tablename__ = "eligibility_checks"

    id = _uuid_pk()
    case_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("sourcing_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requirement_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = sa.Column(sa.String(10), nullable=False)          # PASS | FAIL | REVIEW
    observed_value = sa.Column(sa.JSON, nullable=True)
    observed_unit = sa.Column(sa.String(50), nullable=True)
    reason_code = sa.Column(sa.String(30), nullable=False)
    explanation = sa.Column(sa.Text, nullable=True)
    evidence_ids = sa.Column(sa.JSON, nullable=True)           # list of evidence UUIDs
    rule_version = sa.Column(sa.String(20), nullable=False)
    evaluated_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    case = relationship("SourcingCase", back_populates="eligibility_checks")
    supplier = relationship("Supplier", back_populates="eligibility_checks")
    requirement = relationship("Requirement", back_populates="eligibility_checks")


# ═══════════════════════════════════════════════════════════════════════════
# 8. ELIGIBILITY RESULT — aggregated supplier-level pass/fail/review
# ═══════════════════════════════════════════════════════════════════════════

class EligibilityResult(Base):
    """
    The aggregated eligibility verdict for a supplier across ALL mandatory
    requirements.

    Aggregation rule (Module 3.1):
      any FAIL → FAIL  >  any REVIEW → REVIEW  >  all PASS → PASS
    """
    __tablename__ = "eligibility_results"

    id = _uuid_pk()
    case_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("sourcing_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = sa.Column(sa.String(10), nullable=False)          # PASS | FAIL | REVIEW
    check_ids = sa.Column(sa.JSON, nullable=True)              # list of EligibilityCheck UUIDs
    rule_version = sa.Column(sa.String(20), nullable=False)
    evaluated_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    case = relationship("SourcingCase", back_populates="eligibility_results")
    supplier = relationship("Supplier", back_populates="eligibility_results")
    ranking_results = relationship(
        "RankingResult", back_populates="eligibility_result", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 9. RANKING SCENARIO — a set of weights for preference scoring
# ═══════════════════════════════════════════════════════════════════════════

class RankingScenario(Base):
    """
    A named weight configuration for scoring PASS suppliers on preference
    criteria.  Multiple scenarios can exist per case for sensitivity analysis
    (e.g. "Cost First", "Quality First", "Balanced").
    """
    __tablename__ = "ranking_scenarios"

    id = _uuid_pk()
    case_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("sourcing_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = sa.Column(sa.String(255), nullable=False)
    weights = sa.Column(sa.JSON, nullable=False)               # {requirement_key: float}
    normalization_method = sa.Column(
        sa.String(20), nullable=False, default="MIN_MAX_V1"
    )
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    case = relationship("SourcingCase", back_populates="ranking_scenarios")
    ranking_results = relationship(
        "RankingResult", back_populates="scenario", cascade="all, delete-orphan"
    )
    decision_summaries = relationship(
        "DecisionSummary", back_populates="scenario", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 10. RANKING RESULT — one supplier's score in a scenario
# ═══════════════════════════════════════════════════════════════════════════

class RankingResult(Base):
    """
    The total weighted score and rank position of a single PASS supplier
    within a specific ranking scenario.

    Golden Rule enforcement: `eligibility_result_id` FK guarantees this
    record can only reference a supplier that went through eligibility.
    """
    __tablename__ = "ranking_results"

    id = _uuid_pk()
    scenario_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("ranking_scenarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    eligibility_result_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("eligibility_results.id", ondelete="CASCADE"),
        nullable=False,
    )

    total_score = sa.Column(sa.Float, nullable=False)
    rank = sa.Column(sa.Integer, nullable=False)
    ranking_version = sa.Column(sa.String(20), nullable=False)
    calculated_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    scenario = relationship("RankingScenario", back_populates="ranking_results")
    supplier = relationship("Supplier", back_populates="ranking_results")
    eligibility_result = relationship("EligibilityResult", back_populates="ranking_results")
    score_components = relationship(
        "ScoreComponent", back_populates="ranking_result", cascade="all, delete-orphan"
    )


# ═══════════════════════════════════════════════════════════════════════════
# 11. SCORE COMPONENT — one criterion's contribution to the total score
# ═══════════════════════════════════════════════════════════════════════════

class ScoreComponent(Base):
    """
    Breakdown of how a single preference requirement contributed to a
    supplier's total_score within a ranking result.

    Provides full transparency: raw_value → normalized_score → weight →
    weighted_score, plus evidence_ids for citation traceability.
    """
    __tablename__ = "score_components"

    id = _uuid_pk()
    ranking_result_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("ranking_results.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requirement_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("requirements.id", ondelete="CASCADE"),
        nullable=False,
    )

    raw_value = sa.Column(sa.Float, nullable=True)
    normalized_score = sa.Column(sa.Float, nullable=True)
    weight = sa.Column(sa.Float, nullable=False)
    weighted_score = sa.Column(sa.Float, nullable=False)
    evidence_ids = sa.Column(sa.JSON, nullable=True)           # list of evidence UUIDs
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    ranking_result = relationship("RankingResult", back_populates="score_components")
    requirement = relationship("Requirement", back_populates="score_components")


# ═══════════════════════════════════════════════════════════════════════════
# 12. DECISION SUMMARY — LLM-generated advisory + human decision
# ═══════════════════════════════════════════════════════════════════════════

class DecisionSummary(Base):
    """
    An LLM-generated advisory report for a sourcing case based on a
    specific ranking scenario.  The LLM may only reference stored facts
    (evidence) — it must NOT infer new information.

    `human_decision` records the buyer's actual choice.  This is explicitly
    NOT an approval or supplier contact — it is decision support only.
    """
    __tablename__ = "decision_summaries"

    id = _uuid_pk()
    case_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("sourcing_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scenario_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("ranking_scenarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    recommended_supplier_id = sa.Column(
        sa.String(36),
        sa.ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
    )

    generated_text = sa.Column(sa.Text, nullable=False)
    assumptions = sa.Column(sa.JSON, nullable=True)            # list of strings
    limitations = sa.Column(sa.JSON, nullable=True)            # list of strings
    review_actions = sa.Column(sa.JSON, nullable=True)         # list of strings
    human_decision = sa.Column(sa.Text, nullable=True)
    human_decision_at = sa.Column(sa.DateTime, nullable=True)
    created_at = _created_at()
    updated_at = _updated_at()

    # --- Relationships -------------------------------------------------------
    case = relationship("SourcingCase", back_populates="decision_summaries")
    scenario = relationship("RankingScenario", back_populates="decision_summaries")
    recommended_supplier = relationship("Supplier", foreign_keys=[recommended_supplier_id])
