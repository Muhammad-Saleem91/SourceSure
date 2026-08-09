"""
Pydantic validation schemas — Phase 1, Module 1.2.

Strict separation from ORM models: these schemas define the API contract
(request inputs and response outputs) while `app.db.models` defines the
database tables.  Never return an ORM model directly from a route — always
serialize through the matching schema.
"""
