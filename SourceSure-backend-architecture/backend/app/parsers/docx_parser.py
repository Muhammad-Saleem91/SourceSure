"""
DOCX Parser — Module 2.2c

Extracts text from Word documents.
For simplicity, we treat the entire document as one chunk, 
or split it if it gets too large.
"""

import docx
import logging
from typing import List

from app.parsers.base import ParsedChunk
from app.core.errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class DOCXParser:
    def parse(self, filepath: str) -> List[ParsedChunk]:
        """
        Parses a DOCX file into chunks.
        
        Args:
            filepath: Absolute path to the DOCX file on disk.
            
        Returns:
            A list of ParsedChunk objects containing the document text.
        """
        logger.info("Parsing DOCX file: %s", filepath)
        chunks = []
        
        try:
            doc = docx.Document(filepath)
            
            # Combine all paragraphs and tables into a single text body
            full_text = []
            for element in doc.elements if hasattr(doc, 'elements') else doc.paragraphs:
                # Basic extraction for standard paragraphs
                if isinstance(element, docx.text.paragraph.Paragraph):
                    if element.text.strip():
                        full_text.append(element.text.strip())
            
            # Hack for standard python-docx to iterate over tables too if doc.elements doesn't exist
            if not hasattr(doc, 'elements'):
                for table in doc.tables:
                    for row in table.rows:
                        row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_data:
                            full_text.append(" | ".join(row_data))
                            
            text = "\n".join(full_text)
            
            if text and text.strip():
                chunks.append(
                    ParsedChunk(
                        text=text.strip(),
                        section="Full Document"
                    )
                )
                    
            logger.debug("Successfully parsed DOCX.")
            return chunks
            
        except Exception as e:
            logger.error("Failed to parse DOCX %s: %s", filepath, str(e))
            raise AppError(
                code=ErrorCode.VALIDATION_ERROR,
                message="Failed to parse Word document. Ensure it is a valid .docx file.",
                details={"filepath": filepath, "error": str(e)},
                status_code=422
            )
