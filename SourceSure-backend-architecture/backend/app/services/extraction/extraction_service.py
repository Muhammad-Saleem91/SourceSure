"""
Extraction Service — Module 2.4

Orchestrates the process of extracting evidence from a document.
Ties together Parsers -> LLM -> Validator -> Database.
"""

import logging
from app.db.session import SessionLocal
from app.repositories import document_repo, case_repo, extraction_run_repo, evidence_repo
from app.schemas.common import DocumentStatus, ExtractionRunStatus
from app.parsers.parser_factory import get_parser
from app.ai.llm_client import LLMClient
from app.ai.extraction_validator import validate_and_normalize
from app.core.config import get_settings

logger = logging.getLogger(__name__)

def run_extraction_background(document_id: str):
    """
    Background task to run extraction on a document.
    Owns its own DB session to prevent request-scoped session leaks.
    """
    logger.info("Starting background extraction for document_id=%s", document_id)
    db = SessionLocal()
    try:
        # 1. Fetch document
        doc = document_repo.get_by_id(db, document_id)
        if not doc:
            logger.error("Document %s not found.", document_id)
            return
            
        if doc.status == DocumentStatus.EXTRACTING:
            logger.warning("Document %s is already extracting.", document_id)
            return
            
        # Mark extracting
        document_repo.update_status(db, document_id, DocumentStatus.EXTRACTING)

        # 2. Idempotency Check
        settings = get_settings()
        prompt_version = "v3"  # Hardcoded for now
        schema_version = "v3"
        
        existing_run = extraction_run_repo.get_completed_run(
            db, document_id, settings.LLM_MODEL, prompt_version, schema_version
        )
        if existing_run:
            logger.info("Idempotency match: Run %s already completed for doc %s", existing_run.id, document_id)
            # A real implementation would parse the existing raw response here.
            # Since this is an MVP, we just skip it, but idempotency works.
            if doc.status != DocumentStatus.NEEDS_REVIEW:
                document_repo.update_status(db, document_id, DocumentStatus.READY)
            return

        # Create extraction run record
        run_record = extraction_run_repo.create(
            db,
            document_id=document_id,
            model=settings.LLM_MODEL,
            prompt_version=prompt_version,
            schema_version=schema_version,
            status=ExtractionRunStatus.RUNNING
        )
        
        # 3. Get case requirements
        case = case_repo.get_by_id(db, doc.supplier.case_id)
        requirements = case.requirements
        valid_keys = {req.key for req in requirements}

        # 4. Parse Document
        parser = get_parser(doc.mime_type)
        chunks = parser.parse(doc.stored_path)
        
        # 5. Run LLM Client
        llm = LLMClient()
        extraction_output, prompt_ver, schema_ver = llm.extract(
            chunks=chunks,
            requirements=requirements,
            document_sha256=doc.sha256,
            source_type=doc.mime_type,
        )
        
        # 6. Fetch Existing Evidence for Conflict Detection
        from app.ai.extraction_validator import ValidatedClaim
        existing_evidence = evidence_repo.get_for_supplier(db, doc.supplier_id)
        existing_claims = []
        for ev in existing_evidence:
            existing_claims.append(ValidatedClaim(
                field_key=ev.field_key,
                raw_value=ev.raw_value,
                normalized_value=ev.normalized_value,
                unit=ev.unit,
                state=ev.state,
                confidence=ev.confidence,
                quoted_text=ev.quoted_text,
                page_number=ev.page_number,
                sheet_name=ev.sheet_name,
                cell_range=ev.cell_range,
                section=ev.section,
                provenance_method=getattr(ev, 'provenance_method', None),
                validation_reason=getattr(ev, 'validation_reason', None),
            ))
        
        # 7. Run Quality Validator
        report = validate_and_normalize(
            extraction_output, 
            valid_keys, 
            parsed_chunks=chunks, 
            existing_claims=existing_claims
        )
        
        # 7b. Retroactively update prior conflicting evidence in DB
        conflicting_keys = [c.field_key for c in report.validated if c.state == "CONFLICTING"]
        if conflicting_keys:
            from app.db.models import Evidence
            db.query(Evidence).filter(
                Evidence.supplier_id == doc.supplier_id,
                Evidence.field_key.in_(conflicting_keys),
                Evidence.state == "SUPPORTED"
            ).update({"state": "CONFLICTING"}, synchronize_session=False)
            db.commit()
            logger.info("Updated existing evidence to CONFLICTING for keys: %s", conflicting_keys)
        
        # 8. Save Evidence to Database
        evidence_dicts = []
        for v_claim in report.validated:
            evidence_dicts.append({
                "supplier_id": doc.supplier_id,
                "document_id": document_id,
                "extraction_run_id": run_record.id,
                "field_key": v_claim.field_key,
                "raw_value": v_claim.raw_value,
                "normalized_value": v_claim.normalized_value,
                "unit": v_claim.unit,
                "state": v_claim.state,
                "confidence": v_claim.confidence,
                "quoted_text": v_claim.quoted_text,
                "page_number": v_claim.page_number,
                "sheet_name": v_claim.sheet_name,
                "cell_range": v_claim.cell_range,
                "section": v_claim.section,
                "provenance_method": v_claim.provenance_method,
                "validation_reason": v_claim.validation_reason
            })
            
        evidence_repo.create_batch(db, evidence_dicts)
        logger.info("Saved %d evidence records for doc %s", len(evidence_dicts), document_id)
        
        # 9. Finalize Status
        extraction_run_repo.update_status(db, run_record.id, ExtractionRunStatus.COMPLETED)
        
        if report.has_low_confidence or report.has_conflicts:
            document_repo.update_status(db, document_id, DocumentStatus.NEEDS_REVIEW)
        else:
            document_repo.update_status(db, document_id, DocumentStatus.READY)
            
        logger.info("Finished extraction for doc %s", document_id)
        
    except Exception as e:
        logger.exception("Extraction failed for doc %s", document_id)
        try:
            if 'run_record' in locals():
                extraction_run_repo.update_status(db, run_record.id, ExtractionRunStatus.ERROR, error=str(e))
            document_repo.update_status(db, document_id, DocumentStatus.ERROR, error_message=str(e))
        except Exception as inner_e:
            logger.error("Failed to mark document as ERROR: %s", inner_e)
    finally:
        db.close()
