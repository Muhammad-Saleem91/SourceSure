"""
Repository layer (Data Access Layer) — Phase 1, Module 1.3.

Repositories are the ONLY code allowed to touch the database directly.
Every function receives a SQLAlchemy Session as an explicit parameter
(injected via FastAPI's `get_db` dependency) and returns ORM model
instances or scalar values — never raw SQL result rows.

Services, routers, and rule engines must go through this layer for all
persistence operations.
"""
