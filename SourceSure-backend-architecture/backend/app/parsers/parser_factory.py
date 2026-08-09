"""
Parser Factory — Module 2.2d

Selects the correct parser implementation based on MIME type.
"""

from typing import Protocol, List

from app.parsers.base import ParsedChunk
from app.parsers.pdf_parser import PDFParser
from app.parsers.xlsx_parser import XLSXParser
from app.parsers.docx_parser import DOCXParser
from app.core.errors import AppError, ErrorCode

class ParserProtocol(Protocol):
    def parse(self, filepath: str) -> List[ParsedChunk]:
        ...

def get_parser(mime_type: str) -> ParserProtocol:
    """
    Returns the appropriate parser for the given MIME type.
    """
    if mime_type == "application/pdf":
        return PDFParser()
    elif mime_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return XLSXParser()
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return DOCXParser()
    elif mime_type in [
        "application/vnd.ms-excel",
        "text/csv"
    ]:
        # Both older XLS and CSV can be parsed easily by pandas
        return XLSXParser()
    
    raise AppError(
        code=ErrorCode.VALIDATION_ERROR,
        message=f"No parser implemented for MIME type: {mime_type}",
        status_code=415
    )
