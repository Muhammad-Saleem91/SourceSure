"""Quick smoke test for Module 1.3 Repository implementations."""
import os
import sys

# Add backend dir to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.repositories import case_repo, requirement_repo
from app.schemas.common import RequirementKind, ValueType, Operator

# Use an in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_tests():
    print("Setting up in-memory database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Test Case Repo
        print("\n--- Testing Case Repository ---")
        case = case_repo.create(db, name="Test Case", description="Repo test case")
        print(f"[PASS] Case created with ID: {case.id}")
        
        fetched_case = case_repo.get_by_id(db, case.id)
        assert fetched_case is not None and fetched_case.name == "Test Case"
        print(f"[PASS] Case retrieved by ID")
        
        updated_case = case_repo.update_status(db, case.id, "ACTIVE")
        assert updated_case is not None and updated_case.status == "ACTIVE"
        print(f"[PASS] Case status updated to ACTIVE")
        
        # Test Requirement Repo
        print("\n--- Testing Requirement Repository ---")
        reqs = requirement_repo.replace_for_case(db, case.id, [
            {
                "key": "test_req",
                "label": "Test Requirement",
                "kind": RequirementKind.MANDATORY,
                "value_type": ValueType.BOOLEAN,
                "operator": Operator.EQ,
                "target_value": True
            }
        ])
        print(f"[PASS] {len(reqs)} requirements created/replaced for case")
        
        fetched_reqs = requirement_repo.get_for_case(db, case.id)
        assert len(fetched_reqs) == 1 and fetched_reqs[0].key == "test_req"
        print(f"[PASS] Requirements retrieved for case")

        print("\nAll repository smoke tests completed successfully!")
        
    except Exception as e:
        print(f"\n[FAIL] An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
