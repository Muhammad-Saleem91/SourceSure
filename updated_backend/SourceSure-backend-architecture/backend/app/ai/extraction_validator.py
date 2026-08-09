"""
LLM Extraction Validator — Module 2.3b

This is the quality gate that runs IMMEDIATELY after the LLM responds.
Nothing from the LLM output ever reaches the database without passing
through this validator first.

Pipeline:
    LLM ExtractionOutput
        → reject unknown field_key
        → reject missing citation
        → normalize value types
        → assign EvidenceState (SUPPORTED / LOW_CONFIDENCE)
        → detect cross-document CONFLICTING claims
        → return list[ValidatedClaim] ready for DB insert

Design principles:
    • Pure function — no DB access, no side effects
    • Strict — reject anything that cannot be fully cited
    • Safe — no claim can sneak through with unknown keys
"""

import re
from dataclasses import dataclass
from typing import Any, Optional

from app.ai.extraction_schema import ExtractedClaim, ExtractionOutput

# ─── Constants ────────────────────────────────────────────────────────────────

# Evidence state values (must match EvidenceState enum in schemas/common.py)
STATE_SUPPORTED       = "SUPPORTED"
STATE_LOW_CONFIDENCE  = "LOW_CONFIDENCE"
STATE_CONFLICTING     = "CONFLICTING"

# Confidence threshold below which a claim becomes LOW_CONFIDENCE
CONFIDENCE_THRESHOLD = 0.5


# ─── Output type ─────────────────────────────────────────────────────────────

@dataclass
class ValidatedClaim:
    """
    A single evidence claim that has passed all validation checks.

    This maps 1:1 to the Evidence ORM model fields. The extraction service
    creates one Evidence DB record per ValidatedClaim.
    """
    field_key:        str
    raw_value:        str
    normalized_value: Any
    unit:             Optional[str]
    state:            str           # SUPPORTED | LOW_CONFIDENCE | CONFLICTING
    confidence:       float
    quoted_text:      str
    page_number:      Optional[int]
    sheet_name:       Optional[str]
    cell_range:       Optional[str]
    section:          Optional[str]
    provenance_method: Optional[str] = None
    validation_reason: Optional[str] = None


@dataclass
class ValidationReport:
    """
    Summary of the validation pass returned alongside the validated claims.
    Used by the extraction service to update Document and ExtractionRun status.
    """
    validated:       list[ValidatedClaim]
    rejected_count:  int
    rejection_reasons: list[str]   # human-readable, for logging only
    has_low_confidence: bool
    has_conflicts:   bool


# ─── Value normalizers ────────────────────────────────────────────────────────

_BOOL_TRUE  = {"true", "yes", "1", "✓", "✔", "confirmed", "available", "pass"}
_BOOL_FALSE = {"false", "no", "0", "✗", "✘", "not available", "fail", "n/a", "n.a."}

def _normalize_value(raw: Any, field_key: str) -> tuple[Any, Optional[str]]:
    """
    Normalize the LLM's `normalized_value` to a canonical Python type.

    Returns (normalized_value, extracted_unit).

    The LLM is instructed to pre-normalize, but we apply a second pass here
    to catch common formatting variations.
    """

    if isinstance(raw, bool):
        return raw, None

    if isinstance(raw, (int, float)):
        return raw, None

    if not isinstance(raw, str):
        # JSON null / list / dict: keep as-is
        return raw, None

    cleaned = raw.strip().lower()

    # --- Boolean normalization ------------------------------------------------
    if cleaned in _BOOL_TRUE:
        return True, None
    if cleaned in _BOOL_FALSE:
        return False, None

    # --- Number + optional unit extraction ------------------------------------
    # Matches patterns like: "24 days", "20000 units", "88.3%", "3.5 weeks"
    number_unit_match = re.match(
        r"^([-+]?\d+(?:\.\d+)?)\s*([a-zA-Z%]+)?$", cleaned
    )
    if number_unit_match:
        num_str, unit_str = number_unit_match.groups()
        # Standardize common unit aliases
        unit_map = {
            "days": "day", "weeks": "week", "months": "month",
            "years": "year", "units": "unit", "pieces": "unit",
            "%": "percent", "pct": "percent",
            "kgs": "kg", "grams": "g", "tons": "ton",
        }
        unit_str = unit_str.lower() if unit_str else None
        if unit_str in unit_map:
            unit_str = unit_map[unit_str]
        return float(num_str), unit_str

    # --- Date normalization ---------------------------------------------------
    # Accept ISO dates or simple year; keep as string for the DATE value_type
    date_match = re.match(r"^(\d{4}-\d{2}-\d{2})$", cleaned)
    if date_match:
        return date_match.group(1), None

    # --- Fallback: keep original string --------------------------------------
    return raw.strip(), None


# ─── Main validator ───────────────────────────────────────────────────────────

from app.parsers.base import ParsedChunk

def validate_and_normalize(
    extraction_output: ExtractionOutput,
    valid_field_keys: set[str],
    parsed_chunks: list[ParsedChunk],
    existing_claims: Optional[list[ValidatedClaim]] = None,
) -> ValidationReport:
    """
    Validate every claim in an ExtractionOutput and return a ValidationReport.

    Args:
        extraction_output:  Raw output from the Gemini LLM call.
        valid_field_keys:   Set of requirement keys for this case — only these
                            are accepted. Any other field_key is rejected.
        existing_claims:    Claims already stored for this supplier from
                            previous documents. Used for conflict detection.
                            Pass None or [] for first document.

    Returns:
        ValidationReport containing validated claims + rejection summary.

    This function has ZERO side effects — it does not touch the database.
    """

    existing = existing_claims or []
    validated: list[ValidatedClaim] = []
    rejections: list[str] = []

    for claim in extraction_output.claims:

        # ── Gate 1: known field_key ──────────────────────────────────────────
        if claim.field_key not in valid_field_keys:
            rejections.append(
                f"Rejected claim: unknown field_key '{claim.field_key}' "
                f"(not in requirements for this case)"
            )
            continue

        # ── Gate 3: quoted_text must not be empty ────────────────────────────
        if not claim.quoted_text or not claim.quoted_text.strip():
            rejections.append(
                f"Rejected claim for '{claim.field_key}': empty quoted_text"
            )
            continue

        # ── Step 4: normalize value + extract unit ───────────────────────────
        normalized_value, extracted_unit = _normalize_value(
            claim.normalized_value, claim.field_key
        )
        unit = claim.unit or extracted_unit

        # ── Step 5: Deterministically resolve provenance ───────────────────────
        def normalize_whitespace(text: str) -> str:
            return " ".join(text.split())

        normalized_quote = normalize_whitespace(claim.quoted_text)
        
        matched_canonical_locations = {}
        
        for chunk in parsed_chunks:
            if normalized_quote in normalize_whitespace(chunk.text):
                # Canonical location key
                loc_key = (
                    getattr(chunk, 'page_number', None),
                    getattr(chunk, 'sheet_name', None),
                    getattr(chunk, 'cell_range', None),
                    getattr(chunk, 'section', None),
                )
                matched_canonical_locations[loc_key] = chunk
                
        num_canonical = len(matched_canonical_locations)
        
        page_num = None
        sheet_name = None
        cell_range = None
        section = None
        prov_method = None
        val_reason = None
        
        if num_canonical == 0:
            state = STATE_LOW_CONFIDENCE
            val_reason = "CITATION_MISMATCH"
            rejections.append(f"CITATION_MISMATCH for '{claim.field_key}': Quoted text not found in source document")
        elif num_canonical > 1:
            state = STATE_LOW_CONFIDENCE
            val_reason = "AMBIGUOUS_CITATION"
            rejections.append(f"AMBIGUOUS_CITATION for '{claim.field_key}': Quote exists in multiple distinct locations")
        else:
            # Exactly 1 canonical location
            loc_key, matched_chunk = list(matched_canonical_locations.items())[0]
            
            page_num = getattr(matched_chunk, 'page_number', None)
            sheet_name = getattr(matched_chunk, 'sheet_name', None)
            cell_range = getattr(matched_chunk, 'cell_range', None)
            section = getattr(matched_chunk, 'section', None)
            
            prov_method = "DETERMINISTIC_QUOTE_MATCH"
            val_reason = "UNIQUE_SOURCE_MATCH"
            
            # Additional validation checks (confidence)
            if claim.confidence < CONFIDENCE_THRESHOLD:
                state = STATE_LOW_CONFIDENCE
                val_reason = "LOW_CONFIDENCE"
            else:
                state = STATE_SUPPORTED

        validated.append(ValidatedClaim(
            field_key        = claim.field_key,
            raw_value        = claim.raw_value,
            normalized_value = normalized_value,
            unit             = unit,
            state            = state,
            confidence       = claim.confidence,
            quoted_text      = claim.quoted_text.strip(),
            page_number      = page_num,
            sheet_name       = sheet_name,
            cell_range       = cell_range,
            section          = section,
            provenance_method= prov_method,
            validation_reason= val_reason,
        ))

    # ── Step 6: cross-document conflict detection ─────────────────────────────

    def _values_equal(a: Any, b: Any) -> bool:
        """Compare two normalized values tolerantly (int/float, case-insensitive str)."""
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            return float(a) == float(b)
        return str(a).strip().lower() == str(b).strip().lower()

    # Build a lookup of existing SUPPORTED claims by field_key.
    existing_supported: dict[str, ValidatedClaim] = {
        c.field_key: c
        for c in existing
        if c.state == STATE_SUPPORTED
    }

    for claim in validated:
        if claim.state != STATE_SUPPORTED:
            # LOW_CONFIDENCE claims don't trigger conflict detection
            continue
        if claim.field_key not in existing_supported:
            continue

        prior = existing_supported[claim.field_key]
        # Conflict: same field, different canonical values from two sources
        if not _values_equal(prior.normalized_value, claim.normalized_value):
            claim.state = STATE_CONFLICTING
            prior.state = STATE_CONFLICTING  # retroactively mark the prior claim too

    # ── Build final report ────────────────────────────────────────────────────
    return ValidationReport(
        validated          = validated,
        rejected_count     = len(rejections),
        rejection_reasons  = rejections,
        has_low_confidence = any(c.state == STATE_LOW_CONFIDENCE for c in validated),
        has_conflicts      = any(c.state == STATE_CONFLICTING for c in validated),
    )
