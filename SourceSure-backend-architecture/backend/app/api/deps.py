from typing import Generator
from app.db.session import SessionLocal

def get_db() -> Generator:
    """
    Dependency to get a SQLAlchemy database session.
    Yields the session and ensures it is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
