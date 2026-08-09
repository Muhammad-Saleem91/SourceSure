"""
XLSX Parser — Module 2.2b

Extracts text from Excel spreadsheets, chunking by sheet.
"""

import pandas as pd
import logging
from typing import List

from app.parsers.base import ParsedChunk
from app.core.errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class XLSXParser:
    def parse(self, filepath: str) -> List[ParsedChunk]:
        """
        Parses an Excel file into chunks (one per sheet).
        
        Args:
            filepath: Absolute path to the XLSX file on disk.
            
        Returns:
            A list of ParsedChunk objects containing the sheet text (as markdown/CSV) 
            and the sheet name.
        """
        logger.info("Parsing XLSX file: %s", filepath)
        chunks = []
        
        try:
            # Read all sheets into a dict of DataFrames
            sheets = pd.read_excel(filepath, sheet_name=None, engine="openpyxl")
            
            for sheet_name, df in sheets.items():
                if df.empty:
                    continue
                    
                # Convert to string representation (CSV format is very LLM friendly)
                # Drop fully empty rows/cols to save token space
                df.dropna(how='all', inplace=True)
                df.dropna(axis=1, how='all', inplace=True)
                
                text = df.to_csv(index=False)
                
                if text and text.strip():
                    # For sheets, we can estimate cell range as A1:ColRow
                    max_row = df.shape[0] + 1  # +1 for header
                    max_col = df.shape[1]
                    cell_range = f"A1:{chr(64 + max_col)}{max_row}" if max_col <= 26 else "A1:..."
                    
                    chunks.append(
                        ParsedChunk(
                            text=text.strip(),
                            sheet_name=sheet_name,
                            cell_range=cell_range
                        )
                    )
                    
            logger.debug("Successfully parsed %d sheets from XLSX.", len(chunks))
            return chunks
            
        except Exception as e:
            logger.error("Failed to parse XLSX %s: %s", filepath, str(e))
            raise AppError(
                code=ErrorCode.VALIDATION_ERROR,
                message="Failed to parse Excel document. Ensure it is a valid .xlsx file.",
                details={"filepath": filepath, "error": str(e)},
                status_code=422
            )
