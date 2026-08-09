from app.rules.evaluator import EligibilityCheckResult

def aggregate_supplier_result(checks: list[EligibilityCheckResult]) -> str:
    """
    Exact algorithm from the contract. Never deviate.

    Any FAIL  → overall FAIL
    No FAIL, any REVIEW → overall REVIEW
    All PASS  → overall PASS
    Empty     → Config error (reject run)
    """
    if not checks:
        raise ValueError("Cannot aggregate empty checks. Sourcing case must have at least one mandatory requirement.")
        
    if any(c.status == "FAIL" for c in checks):
        return "FAIL"
    if any(c.status == "REVIEW" for c in checks):
        return "REVIEW"
    return "PASS"
