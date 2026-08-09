from typing import Optional
from pydantic import BaseModel, Field

class ExtractedClaim(BaseModel):
    """
    A single fact extracted from a document by the LLM.
    Must cite the exact location and quote the text.
    """
    field_key: str = Field(description="Must match exactly one of the provided field keys.")
    raw_value: str = Field(description="The exact text as found in the document.")
    normalized_value: str | int | float | bool | None = Field(description="The value normalized to a boolean, number, string, or date string (YYYY-MM-DD).")
    unit: Optional[str] = Field(default=None, description="The unit of the value, e.g., 'day', 'unit', 'percent'. If none, leave null.")
    confidence: float = Field(description="Confidence that this claim is explicitly stated (0.0 to 1.0).")
    quoted_text: str = Field(description="A short excerpt (≤ 200 chars) proving the claim.")

class ExtractionOutput(BaseModel):
    """
    The structured output expected from the LLM extraction pass.
    """
    claims: list[ExtractedClaim] = Field(description="List of extracted facts matching the requested fields.")
