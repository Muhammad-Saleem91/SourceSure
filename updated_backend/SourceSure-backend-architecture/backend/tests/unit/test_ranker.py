"""
Unit tests for ranking math rules (Module 4.1).
"""

from app.rules.ranker import normalize_min_max, calculate_weighted_score, assign_ranks

def test_higher_is_better_normalization():
    # Value is exactly max
    assert normalize_min_max(100, 50, 100, "HIGHER_IS_BETTER") == 100.0
    # Value is exactly min
    assert normalize_min_max(50, 50, 100, "HIGHER_IS_BETTER") == 0.0
    # Value in middle
    assert normalize_min_max(75, 50, 100, "HIGHER_IS_BETTER") == 50.0

def test_lower_is_better_normalization():
    # Lower is better: min gets 100
    assert normalize_min_max(50, 50, 100, "LOWER_IS_BETTER") == 100.0
    # Max gets 0
    assert normalize_min_max(100, 50, 100, "LOWER_IS_BETTER") == 0.0
    # Middle gets 50
    assert normalize_min_max(75, 50, 100, "LOWER_IS_BETTER") == 50.0

def test_zero_variance_normalization():
    # min == max should return 100 for all
    assert normalize_min_max(50, 50, 50, "HIGHER_IS_BETTER") == 100.0
    assert normalize_min_max(50, 50, 50, "LOWER_IS_BETTER") == 100.0

def test_weighted_scoring():
    assert calculate_weighted_score(100.0, 0.4) == 40.0
    assert calculate_weighted_score(0.0, 0.4) == 0.0
    assert calculate_weighted_score(50.0, 0.5) == 25.0
    assert calculate_weighted_score(33.3333, 0.3) == 10.0

def test_deterministic_tie_breaking():
    suppliers = [
        {"supplier_id": "z", "supplier_name": "Zeus", "total_score": 50.0},
        {"supplier_id": "a", "supplier_name": "Apollo", "total_score": 50.0},
        {"supplier_id": "b", "supplier_name": "Apollo", "total_score": 50.0},
        {"supplier_id": "top", "supplier_name": "Hera", "total_score": 90.0},
    ]
    
    ranked = assign_ranks(suppliers)
    
    # 1. Highest score wins
    assert ranked[0]["supplier_id"] == "top"
    assert ranked[0]["rank"] == 1
    
    # 2. Score tie -> Name ASC
    # 'Apollo' < 'Zeus', so 'a' and 'b' beat 'z'
    # 3. Name tie -> ID ASC
    # 'a' < 'b'
    assert ranked[1]["supplier_id"] == "a"
    assert ranked[1]["rank"] == 2
    
    assert ranked[2]["supplier_id"] == "b"
    assert ranked[2]["rank"] == 3
    
    assert ranked[3]["supplier_id"] == "z"
    assert ranked[3]["rank"] == 4
