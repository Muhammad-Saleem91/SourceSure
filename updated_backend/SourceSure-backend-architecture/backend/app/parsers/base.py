"""
Base types for the document parsing layer.

`ParsedChunk` is the single shared contract between:
  • Parsers  (producers):  pdf_parser, xlsx_parser, docx_parser
  • LLM client (consumer): ai/llm_client.py

Every chunk carries the raw text AND its source location so that the LLM
can echo back a valid citation in each extracted claim.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ParsedChunk:
    """
    A single unit of text extracted from a document, tagged with its origin.

    Exactly one location field should be non-null per chunk:
      • PDF  → page_number
      • XLSX → sheet_name + (optional) cell_range
      • DOCX → section

    `text` must never be empty — parsers skip whitespace-only chunks.
    """

    text: str

    # --- Location fields (at least one must be set) --------------------------
    page_number: Optional[int] = None    # 1-indexed PDF page
    sheet_name: Optional[str] = None     # XLSX worksheet name
    cell_range: Optional[str] = None     # XLSX range, e.g. "B5:C10"
    section: Optional[str] = None        # DOCX heading text


@dataclass
class ParseResult:
    """
    Wraps the output of a complete document parse pass.

    Carries the chunks plus document-level metadata (page count, detected
    mime type) so the ingestion service can update the Document record.
    """

    chunks: list[ParsedChunk] = field(default_factory=list)
    page_count: Optional[int] = None
    mime_type: Optional[str] = None
    char_count: int = 0

    def is_empty(self) -> bool:
        """True if no usable text was extracted from the document."""
        return len(self.chunks) == 0 or self.char_count == 0
