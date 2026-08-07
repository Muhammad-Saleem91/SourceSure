# SourceSure

SourceSure is an evidence-first manufacturing sourcing copilot built for supplier shortlisting.

## Core Principle

**LLM extracts and explains. Rules validate. Mathematics ranks. Human decides.**

## Primary User

Strategic Sourcing Manager / Sourcing Engineer.

## Core Workflow

1. Define manufacturing requirements
2. Ingest supplier documents
3. Extract source-backed supplier evidence
4. Evaluate mandatory requirements as PASS / FAIL / REVIEW
5. Rank only eligible suppliers
6. Perform sensitivity analysis
7. Present an evidence-backed shortlist for human review

## Tech Stack

### Frontend
- Next.js
- Tailwind CSS

### Backend
- FastAPI
- Python
- SQLite
- SQLAlchemy
- Pydantic

### Document Processing
- PyMuPDF
- pandas
- openpyxl
- python-docx

### AI
- Structured-output LLM

### Testing
- pytest

## Project Structure

- `frontend/` - user interface
- `backend/` - API, AI, rules, ranking and business logic
- `evaluation/` - baseline and evaluation framework
- `tests/` - unit and integration tests
- `data/` - challenge/sample data
- `docs/` - architecture and technical documentation

## Development Status

Currently in **Phase 0: Project Foundation**.