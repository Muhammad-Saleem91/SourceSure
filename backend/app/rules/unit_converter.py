from typing import Callable

UNIT_CONVERSIONS: dict[tuple[str, str], Callable[[float], float]] = {
    ("week",  "day"):  lambda x: x * 7,
    ("day",   "week"): lambda x: x / 7,
    ("month", "day"):  lambda x: x * 30,
    ("day",   "month"):lambda x: x / 30,
    ("year",  "day"):  lambda x: x * 365,
    ("day",   "year"): lambda x: x / 365,
    ("kg",    "g"):    lambda x: x * 1000,
    ("g",     "kg"):   lambda x: x / 1000,
    ("ton",   "kg"):   lambda x: x * 1000,
    ("kg",    "ton"):  lambda x: x / 1000,
}

class UnitMismatchError(Exception):
    """Raised when no conversion path exists between two units."""
    pass

def convert(value: float, from_unit: str, to_unit: str) -> float:
    """
    Convert value from from_unit to to_unit.
    Raises UnitMismatchError if conversion not in allowlist.
    """
    if from_unit == to_unit:
        return value

    key = (from_unit.lower().strip(), to_unit.lower().strip())
    if key not in UNIT_CONVERSIONS:
        raise UnitMismatchError(
            f"No conversion from '{from_unit}' to '{to_unit}'. "
            f"Add it to UNIT_CONVERSIONS if it's valid."
        )
    return UNIT_CONVERSIONS[key](value)
