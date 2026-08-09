from typing import Any

def check_eq(observed: Any, target: Any) -> bool:
    return type(observed) == type(target) and observed == target

def check_ne(observed: Any, target: Any) -> bool:
    return not check_eq(observed, target)

def check_gt(observed: float, target: float) -> bool:
    return float(observed) > float(target)

def check_gte(observed: float, target: float) -> bool:
    return float(observed) >= float(target)

def check_lt(observed: float, target: float) -> bool:
    return float(observed) < float(target)

def check_lte(observed: float, target: float) -> bool:
    return float(observed) <= float(target)

def check_in(observed: Any, allowed_values: list) -> bool:
    return observed in allowed_values

def check_exists(observed: Any) -> bool:
    return observed is not None

OPERATOR_MAP = {
    "EQ":     check_eq,
    "NE":     check_ne,
    "GT":     check_gt,
    "GTE":    check_gte,
    "LT":     check_lt,
    "LTE":    check_lte,
    "IN":     check_in,
    "EXISTS": check_exists,
}
