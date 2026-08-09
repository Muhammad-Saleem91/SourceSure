.PHONY: backend test migrate

backend:
	uvicorn app.main:app --reload

test:
	pytest

migrate:
	alembic upgrade head
