"""
Database session management.

This module owns the engine and session factory. Nothing outside
`app/db` and `app/repositories` should import SQLAlchemy directly —
routers and services depend on `get_db()` / repository classes only.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# `check_same_thread` only applies to SQLite; harmless to pass for other engines
# since it is filtered out via connect_args being SQLite-specific below.
_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models (see app/db/models.py)."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a session, always closed on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
