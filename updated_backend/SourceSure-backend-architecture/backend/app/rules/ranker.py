"""
Deterministic Ranking Engine Rules — Module 4.1.

Pure Python logic for Min-Max normalization, weighted scoring, and 
deterministic tie-breaking. No database access or API logic belongs here.
"""

from typing import Dict, List, Any


def normalize_min_max(
    value: float,
    min_val: float,
    max_val: float,
    direction: str = "HIGHER_IS_BETTER",
) -> float:
    """
    Apply Min-Max normalization to a raw value, returning a score from 0.0 to 100.0.

    Handles zero-variance (min == max) by assigning a perfect 100.0 score,
    avoiding division by zero and correctly recognizing that no supplier
    is "worse" than any other.

    Args:
        value: The raw preference value.
        min_val: The minimum raw value across all eligible suppliers.
        max_val: The maximum raw value across all eligible suppliers.
        direction: "HIGHER_IS_BETTER" or "LOWER_IS_BETTER" or "TARGET_IS_BEST" (not implemented in v1).

    Returns:
        float: Normalized score [0.0, 100.0].
    """
    if min_val == max_val:
        # Zero variance: everyone is equally good.
        return 100.0

    # Ensure value is clamped within min/max bounds just in case of weird floats
    value = max(min_val, min(max_val, value))

    if direction == "LOWER_IS_BETTER":
        # Lower raw value receives higher normalized score
        normalized = (max_val - value) / (max_val - min_val)
    else:
        # HIGHER_IS_BETTER is the default
        normalized = (value - min_val) / (max_val - min_val)

    return round(normalized * 100.0, 4)


def calculate_weighted_score(normalized_score: float, weight: float) -> float:
    """
    Calculate the weighted contribution of a single score component.

    Args:
        normalized_score: The 0-100 normalized score.
        weight: The fractional weight (e.g., 0.4).

    Returns:
        float: Weighted contribution (e.g., 40.0).
    """
    return round(normalized_score * weight, 4)


def assign_ranks(supplier_scores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sort a list of supplier dictionaries and assign sequential ranks.

    Invariants (Deterministic tie-breaking):
    1. total_score DESC (highest score wins)
    2. supplier_name ASC (alphabetical fallback)
    3. supplier_id ASC (UUID fallback guarantees absolute determinism)

    Args:
        supplier_scores: List of dicts, each must contain 'total_score', 'supplier_name', and 'supplier_id'.

    Returns:
        The same list, mutated and sorted, with a new 'rank' integer key added (1-indexed).
    """
    # Sort in place
    # Since we want DESC for score, but ASC for names/IDs, we use a tuple where score is negated.
    # Note: Negating works for floats. Strings remain standard.
    supplier_scores.sort(
        key=lambda s: (
            -s.get("total_score", 0.0),
            s.get("supplier_name", "") or "",
            s.get("supplier_id", "") or ""
        )
    )

    # Assign rank indices sequentially
    for idx, supplier in enumerate(supplier_scores):
        supplier["rank"] = idx + 1

    return supplier_scores
