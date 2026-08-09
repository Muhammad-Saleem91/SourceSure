from app.repositories import case_repo, requirement_repo
from app.schemas.common import RequirementKind, ValueType, Operator

# ═══════════════════════════════════════════════════════════════════════════
# Repository Layer Tests
# ═══════════════════════════════════════════════════════════════════════════

def test_case_crud(db_session):
    """Test SourcingCase creation, retrieval, and updates."""
    # 1. Create
    case = case_repo.create(db_session, name="Test Case", description="Repo test case")
    assert case.id is not None
    assert case.name == "Test Case"
    
    # 2. Retrieve
    fetched_case = case_repo.get_by_id(db_session, case.id)
    assert fetched_case is not None
    assert fetched_case.name == "Test Case"
    
    # 3. Update Status
    updated_case = case_repo.update_status(db_session, case.id, "ACTIVE")
    assert updated_case is not None
    assert updated_case.status == "ACTIVE"


def test_requirement_replace(db_session):
    """Test the atomic replacement of requirements for a given case."""
    case = case_repo.create(db_session, name="Req Case", description="Requirement test case")
    
    # 1. Replace/Create
    reqs = requirement_repo.replace_for_case(db_session, case.id, [
        {
            "key": "test_req",
            "label": "Test Requirement",
            "kind": RequirementKind.MANDATORY,
            "value_type": ValueType.BOOLEAN,
            "operator": Operator.EQ,
            "target_value": True
        }
    ])
    assert len(reqs) == 1
    assert reqs[0].key == "test_req"
    
    # 2. Retrieve
    fetched_reqs = requirement_repo.get_for_case(db_session, case.id)
    assert len(fetched_reqs) == 1
    assert fetched_reqs[0].key == "test_req"
