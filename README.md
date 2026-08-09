# SourceSure

**SourceSure** is an automated, AI-powered due diligence and supplier compliance pipeline. It is built to evaluate complex, multi-page supplier documents (certifications, audits, specs) against rigorous business requirements, turning unstructured procurement data into deterministic compliance decisions.

---

## 🏛️ System Architecture

SourceSure is organized as a monorepo containing a modern web frontend and a highly robust, AI-driven backend pipeline.

### Core Architecture
- **Frontend (Next.js):** A responsive, dashboard-driven UI where procurement officers define sourcing cases, configure mandatory and preferential requirements, and upload supplier evidence for processing.
- **Backend (FastAPI):** A high-performance Python API handling orchestration, AI extraction, and rule evaluation.
- **AI Extraction Pipeline:** Leverages Google's Gemini 2.5 API with rigorous `Pydantic` schema enforcement to extract facts from PDFs and text files with zero hallucinations.
- **Deterministic Eligibility Engine:** Processes the AI-extracted facts against user-defined mandatory constraints to automatically flag compliant vs. non-compliant suppliers.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (via Next.js conventions)

### Backend (`/backend`)
- **Framework:** FastAPI (Python 3.12+)
- **Database:** SQLite (via SQLAlchemy & Alembic)
- **AI Integration:** Google GenAI SDK (Gemini 2.5 Flash/Pro)
- **Document Processing:** PyMuPDF

---

## 🚀 Quick Start

To get SourceSure running locally, you need to run both the backend API and the frontend client. 

### 1. Start the Backend API

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up your virtual environment and install dependencies:
   ```bash
   uv venv --python 3.12
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   
   uv pip install -r requirements.txt
   ```
3. Set up your environment variables by creating a `.env` file (you can copy `.env.example`). You will need a valid `LLM_API_KEY` for Google Gemini.
4. Run the database migrations to set up SQLite:
   ```bash
   uv run alembic upgrade head
   ```
5. Start the FastAPI development server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
   *The backend will run on `http://127.0.0.1:8000`.*

### 2. Start the Frontend Client

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000` (or `3001` if port 3000 is occupied).*

---

## 🧪 Testing & Evaluation

SourceSure includes custom evaluation scripts to mathematically prove extraction precision, adversarial robustness, and time savings over manual review.

To run the Pytest suite (requires backend setup):
```bash
cd backend
pytest tests/ -v
```

For accuracy and ROI evaluation engines, please refer to the deeper documentation within `backend/README.md`.

---

## 📁 Repository Structure

```text
/
├── backend/            # FastAPI python backend and AI Engine
│   ├── app/            # Core business logic, routers, models
│   ├── evaluation/     # ROI and accuracy evaluation scripts
│   ├── migrations/     # Alembic database migrations
│   └── tests/          # Pytest suite including adversarial defenses
└── frontend/           # Next.js React application
    ├── app/            # Next.js App Router pages
    ├── components/     # React UI components
    └── lib/            # Shared utilities and API client
```
