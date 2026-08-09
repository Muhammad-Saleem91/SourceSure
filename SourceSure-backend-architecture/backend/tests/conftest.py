import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base

# ═══════════════════════════════════════════════════════════════════════════
# Database Fixtures
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture(scope="session")
def engine():
    """
    Create a single in-memory SQLite engine for the test session.
    Using StaticPool ensures that all connections use the same in-memory DB.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Drop all tables after session
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(engine):
    """
    Provide a fresh database session for a single test.
    Rolls back any changes made during the test to keep isolation.
    """
    connection = engine.connect()
    transaction = connection.begin()
    
    Session = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = Session()
    
    try:
        yield session
    finally:
        session.close()
        # Rollback the transaction to ensure a clean slate for the next test
        transaction.rollback()
        connection.close()


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """
    Custom hook to explicitly print the number of failed tests,
    even if that number is 0.
    """
    passed = len(terminalreporter.stats.get("passed", []))
    failed = len(terminalreporter.stats.get("failed", []))
    
    # We print a bright explicit summary line
    color = "green" if failed == 0 else "red"
    terminalreporter.write_line("")
    terminalreporter.write_sep("=", f"EXPLICIT SUMMARY: {passed} passed, {failed} failed", **{color: True, "bold": True})
