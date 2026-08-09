import pytest
from app.db.session import SessionLocal
from app.db.models import Supplier, Document, ExtractionRun, Evidence, SourcingCase
from app.services.extraction.extraction_service import run_extraction_background
from app.schemas.common import ExtractionRunStatus, DocumentStatus
from unittest.mock import patch
import uuid
import datetime

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_case_supplier(db_session):
    # Setup Case
    case = SourcingCase(
        id=str(uuid.uuid4()),
        name="Test Case Provenance",
        status="ACTIVE"
    )
    db_session.add(case)
    
    # Setup Supplier
    supplier = Supplier(
        id=str(uuid.uuid4()),
        case_id=case.id,
        name="Supplier C Integration",
        status="PENDING"
    )
    db_session.add(supplier)
    db_session.commit()
    
    return case, supplier

def test_symmetric_conflict_persistence(db_session, test_case_supplier):
    """
    Proves that a new conflicting evidence record retroactively updates the prior
    Evidence row in the SQLite database to CONFLICTING.
    """
    case, supplier = test_case_supplier
    
    # 1. Create a prior SUPPORTED Evidence record
    doc1 = Document(
        id=str(uuid.uuid4()),
        supplier_id=supplier.id,
        display_name="doc1.pdf",
        stored_path="doc1.pdf",
        mime_type="application/pdf",
        sha256="hash1",
        status="READY"
    )
    db_session.add(doc1)
    
    run1 = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc1.id,
        model="gemini-mock",
        prompt_version="v3",
        schema_version="v3",
        status="COMPLETED"
    )
    db_session.add(run1)
    
    prior_evidence = Evidence(
        id=str(uuid.uuid4()),
        supplier_id=supplier.id,
        document_id=doc1.id,
        extraction_run_id=run1.id,
        field_key="iso_9001",
        raw_value="Certified",
        normalized_value=True, # Original says True
        state="SUPPORTED",
        confidence=0.95,
        quoted_text="We have ISO 9001.",
        page_number=1,
        provenance_method="DETERMINISTIC_QUOTE_MATCH",
        validation_reason="UNIQUE_SOURCE_MATCH"
    )
    db_session.add(prior_evidence)
    db_session.commit()
    
    # 2. Setup the new document and mock the extraction
    doc2 = Document(
        id=str(uuid.uuid4()),
        supplier_id=supplier.id,
        display_name="doc2.xlsx",
        stored_path="doc2.xlsx",
        mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sha256="hash2",
        status="UPLOADED"
    )
    db_session.add(doc2)
    db_session.commit()
    
    # Mock parser to return a chunk with the quote
    from app.parsers.base import ParsedChunk
    chunks = [
        ParsedChunk(
            text="Supplier C does not hold this.",
            page_number=None,
            sheet_name="Compliance",
            cell_range="A3",
            section=None
        )
    ]
    
    # Mock LLM to return a claim with normalized_value=False
    from app.ai.extraction_schema import ExtractionOutput, ExtractedClaim
    claims = [
        ExtractedClaim(
            field_key="iso_9001",
            raw_value="Not Certified",
            normalized_value=False,
            confidence=0.95,
            quoted_text="Supplier C does not hold this."
        )
    ]
    output = ExtractionOutput(claims=claims)
    
    with patch('app.services.extraction.extraction_service.get_parser') as mock_get_parser, \
         patch('app.services.extraction.extraction_service.LLMClient') as mock_llm_class, \
         patch('app.repositories.case_repo.get_by_id') as mock_case_get:
        
        # Setup mocks
        mock_parser = mock_get_parser.return_value
        mock_parser.parse.return_value = chunks
        
        mock_llm = mock_llm_class.return_value
        mock_llm.extract.return_value = (output, "v3", "v3")
        
        class DummyCase:
            class DummyReq:
                key = "iso_9001"
            requirements = [DummyReq()]
        mock_case_get.return_value = DummyCase()
        
        # 3. Run the extraction service
        run_extraction_background(doc2.id)
    
    # 4. Verify Database Persistence independently
    db_session.expire_all() # Force fresh read from DB
    
    all_evidence = db_session.query(Evidence).filter(
        Evidence.field_key == "iso_9001",
        Evidence.supplier_id == supplier.id
    ).all()
    assert len(all_evidence) == 2
    
    for ev in all_evidence:
        assert ev.state == "CONFLICTING", f"Evidence {ev.id} state was {ev.state}, expected CONFLICTING"
        if ev.id == prior_evidence.id:
            assert ev.normalized_value == True
        else:
            assert ev.normalized_value == False
            assert ev.sheet_name == "Compliance"
            assert ev.provenance_method == "DETERMINISTIC_QUOTE_MATCH"
