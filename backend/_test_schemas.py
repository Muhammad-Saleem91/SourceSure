"""Quick smoke test for Module 1.2 schema validation rules."""
from app.schemas.requirements import RequirementCreate, RequirementsUpdate
from app.schemas.common import RequirementKind, ValueType, Operator, Direction

# --- Test 1: Valid MANDATORY requirement ---
r = RequirementCreate(
    key="cnc_5axis", label="CNC 5-axis",
    kind=RequirementKind.MANDATORY, value_type=ValueType.BOOLEAN,
    operator=Operator.EQ, target_value=True,
)
print(f"[PASS] MANDATORY requirement created: {r.key}")

# --- Test 2: Valid PREFERENCE requirement ---
p = RequirementCreate(
    key="quality_score", label="Quality Score",
    kind=RequirementKind.PREFERENCE, value_type=ValueType.NUMBER,
    weight=0.4, direction=Direction.HIGHER_IS_BETTER,
)
print(f"[PASS] PREFERENCE requirement created: {p.key}")

# --- Test 3: MANDATORY without operator → should fail ---
try:
    RequirementCreate(
        key="bad", label="Bad",
        kind=RequirementKind.MANDATORY, value_type=ValueType.BOOLEAN,
    )
    print("[FAIL] Should have raised validation error for missing operator!")
except Exception as e:
    print(f"[PASS] Correctly rejected MANDATORY without operator: {e}")

# --- Test 4: Duplicate keys → should fail ---
try:
    RequirementsUpdate(requirements=[r, r])
    print("[FAIL] Should have rejected duplicate keys!")
except Exception as e:
    print(f"[PASS] Correctly rejected duplicate keys: {e}")

# --- Test 5: PREFERENCE without weight → should fail ---
try:
    RequirementCreate(
        key="bad_pref", label="Bad Pref",
        kind=RequirementKind.PREFERENCE, value_type=ValueType.NUMBER,
        direction=Direction.HIGHER_IS_BETTER,
    )
    print("[FAIL] Should have raised validation error for missing weight!")
except Exception as e:
    print(f"[PASS] Correctly rejected PREFERENCE without weight: {e}")

print("\nAll schema validation tests passed.")
