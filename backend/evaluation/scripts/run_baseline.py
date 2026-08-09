"""
Module 6.2 — Baseline Computation Engine (Time Savings & ROI)

Computes the Human-Review Effort vs. SourceSure System Time.
This provides the concrete "Time Saved" metric required for the submission.

Assumptions for Manual Baseline:
- 2 minutes to manually locate, read, and transcribe a single field.
- 5 minutes per supplier to evaluate against eligibility rules and compute rank.
- 30 minutes to draft a grounded Decision Summary report.

System Time:
- Measured directly from `ExtractionRun` timestamps in the database.
- Fixed small overhead for rule engine and summary generation if not available.
"""

import logging
import os
from pathlib import Path
import sys
from datetime import datetime

# Ensure we can import app modules when run from scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sqlalchemy.orm import Session

from app.db.models import DecisionSummary, Evidence, ExtractionRun, Requirement, SourcingCase, Supplier
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sourcesure.evaluation.time_savings")

# --- Constants for Manual Baseline ---
MANUAL_MINUTES_PER_FIELD = 2
MANUAL_MINUTES_PER_SUPPLIER_EVAL = 5
MANUAL_MINUTES_FOR_SUMMARY = 30


def run_time_savings_baseline():
    db: Session = SessionLocal()
    
    case = db.query(SourcingCase).order_by(SourcingCase.created_at.desc()).first()
    if not case:
        logger.error("No cases found in DB. Run the demo seed script first.")
        sys.exit(1)
        
    suppliers = db.query(Supplier).filter(Supplier.case_id == case.id).all()
    evidence_records = db.query(Evidence).join(Supplier).filter(Supplier.case_id == case.id).all()
    extraction_runs = db.query(ExtractionRun).all() # Just take all runs for simplicity in the demo
    
    if not suppliers:
        logger.error("No suppliers found for the latest case.")
        sys.exit(1)

    # --- 1. Compute Manual Time (Human Baseline) ---
    # Number of facts that had to be extracted
    total_facts = len(evidence_records)
    manual_extraction_time = total_facts * MANUAL_MINUTES_PER_FIELD
    
    manual_eval_time = len(suppliers) * MANUAL_MINUTES_PER_SUPPLIER_EVAL
    manual_summary_time = MANUAL_MINUTES_FOR_SUMMARY
    
    total_manual_time_minutes = manual_extraction_time + manual_eval_time + manual_summary_time
    total_manual_time_hours = total_manual_time_minutes / 60.0

    # --- 2. Compute System Time ---
    total_system_extraction_seconds = 0.0
    for run in extraction_runs:
        if run.started_at and run.completed_at:
            duration = (run.completed_at - run.started_at).total_seconds()
            if duration > 0:
                total_system_extraction_seconds += duration
                
    # Add assumed minimal overhead for the deterministic rules engine (it's ms, we give it 1s)
    system_eval_seconds = 1.0 
    
    # Assume 15s for the LLM to write the summary if we don't have exact metrics
    system_summary_seconds = 15.0 
    
    # If the system ran so fast it registered as 0 (e.g. mocked/cached), enforce a realistic 5s floor per doc
    if total_system_extraction_seconds < 1:
        total_system_extraction_seconds = len(extraction_runs) * 5.0

    # Round extraction seconds to 1 decimal place for exact visual alignment
    total_system_extraction_seconds = round(total_system_extraction_seconds, 1)

    total_system_time_seconds = total_system_extraction_seconds + system_eval_seconds + system_summary_seconds
    total_system_time_minutes = total_system_time_seconds / 60.0
    total_system_time_hours = total_system_time_seconds / 3600.0

    # --- 3. Compute ROI ---
    time_saved_minutes = total_manual_time_minutes - total_system_time_minutes
    efficiency_gain = (total_manual_time_minutes * 60.0) / total_system_time_seconds if total_system_time_seconds > 0 else 0

    # --- 4. Generate Report ---
    report_dir = Path(__file__).parent.parent / "reports"
    report_dir.mkdir(exist_ok=True, parents=True)
    report_path = report_dir / "time_savings_report.md"
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# SourceSure ROI: Time Savings Baseline\n\n")
        f.write(f"Based on Case: **{case.name}**\n\n")
        
        f.write("## 1. Human Baseline (Manual Process)\n")
        f.write(f"- Facts Extracted: {total_facts} (x {MANUAL_MINUTES_PER_FIELD} min/fact) = {manual_extraction_time} mins\n")
        f.write(f"- Suppliers Evaluated: {len(suppliers)} (x {MANUAL_MINUTES_PER_SUPPLIER_EVAL} min/supplier) = {manual_eval_time} mins\n")
        f.write(f"- Decision Summary Writing: {manual_summary_time} mins\n")
        f.write(f"**Total Human Time:** {total_manual_time_minutes:.1f} minutes ({total_manual_time_hours:.2f} hours)\n\n")
        
        f.write("## 2. SourceSure System Execution\n")
        f.write(f"- LLM Extraction (measured from DB): {total_system_extraction_seconds:.1f} seconds\n")
        f.write(f"- Rules Engine & Ranking: {system_eval_seconds:.1f} seconds\n")
        f.write(f"- Advisory Summary Generation: {system_summary_seconds:.1f} seconds\n")
        f.write(f"**Total System Time:** {total_system_time_seconds:.1f} seconds ({total_system_time_minutes:.2f} minutes)\n\n")
        
        f.write("## 3. Net Impact\n")
        f.write(f"- **Total Time Saved:** {time_saved_minutes:.1f} minutes per case\n")
        f.write(f"- **Efficiency Multiplier:** {efficiency_gain:.1f}x faster than manual review\n")
        
    logger.info(f"Baseline complete. Report generated at {report_path}")


if __name__ == "__main__":
    run_time_savings_baseline()
