"""
PDF Parser — Module 2.2a

Extracts text from PDF documents, chunking by page.
"""

import fitz  # PyMuPDF
import logging
from typing import List

from app.parsers.base import ParsedChunk
from app.core.errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class PDFParser:
    def parse(self, filepath: str) -> List[ParsedChunk]:
        """
        Parses a PDF file into chunks (one per page).
        
        Args:
            filepath: Absolute path to the PDF file on disk.
            
        Returns:
            A list of ParsedChunk objects containing the page text and page number.
        """
        logger.info("Parsing PDF file: %s", filepath)
        chunks = []
        
        try:
            doc = fitz.open(filepath)
            for page_num, page in enumerate(doc, start=1):
                text = page.get_text()
                if text and text.strip():
                    chunks.append(
                        ParsedChunk(
                            text=text.strip(),
                            page_number=page_num
                        )
                    )
            doc.close()
            logger.debug("Successfully parsed %d pages from PDF.", len(chunks))
            return chunks
            
        except Exception as e:
            logger.error("Failed to parse PDF %s: %s", filepath, str(e))
            raise AppError(
                code=ErrorCode.VALIDATION_ERROR,
                message="Failed to parse PDF document. The file may be corrupt or encrypted.",
                details={"filepath": filepath, "error": str(e)},
                status_code=422
            )
