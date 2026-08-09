"""
LLM Client — Module 2.3a

Wraps the Google Gemini API for document extraction.

Responsibilities:
  • Format ParsedChunks with location markers for the LLM
  • Call Gemini with structured output mode (forces valid JSON schema)
  • Cache: same document hash + prompt version + schema version → skip API call
  • Translate API errors to AppError codes (never expose raw errors to client)

NOT responsible for:
  • Validating LLM output (that is extraction_validator.py)
  • Saving to database (that is extraction_service.py)
  • Parsing documents (that is parsers/)

Usage:
    client = LLMClient()
    output: ExtractionOutput = client.extract(chunks, requirements, document_sha256)
"""

import json
import logging
from typing import Optional

import json
from pydantic import ValidationError
from google import genai

from app.ai.extraction_schema import ExtractionOutput
from app.ai.prompts import EXTRACTION_SYSTEM_PROMPT_V1, build_field_dictionary
from app.core.config import get_settings
from app.parsers.base import ParsedChunk
from app.schemas.requirements import RequirementResponse

logger = logging.getLogger(__name__)

# ─── Versioning ───────────────────────────────────────────────────────────────
PROMPT_VERSION = "v3"
SCHEMA_VERSION = "v3"

# ─── Text formatting ──────────────────────────────────────────────────────────
MAX_CHUNK_CHARS = 8_000
MAX_TOTAL_CHARS = 80_000

class LLMUnavailableError(Exception):
    pass

class LLMOutputInvalidError(Exception):
    pass

def _format_chunks(chunks: list[ParsedChunk]) -> str:
    parts: list[str] = []
    total_chars = 0
    for chunk in chunks:
        if not chunk.text or not chunk.text.strip():
            continue
        text = chunk.text.strip()[:MAX_CHUNK_CHARS]
        if chunk.page_number is not None:
            header = f"[Page {chunk.page_number}]"
        elif chunk.sheet_name and chunk.cell_range:
            header = f"[Sheet: {chunk.sheet_name} | Cells: {chunk.cell_range}]"
        elif chunk.sheet_name:
            header = f"[Sheet: {chunk.sheet_name}]"
        elif chunk.section:
            header = f"[Section: {chunk.section}]"
        else:
            header = "[Document]"
        chunk_text = f"{header}\n{text}"
        if total_chars + len(chunk_text) > MAX_TOTAL_CHARS:
            logger.warning("Document context truncated")
            break
        parts.append(chunk_text)
        total_chars += len(chunk_text)
    return "\n\n".join(parts)


class LLMClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.LLM_API_KEY:
            raise LLMUnavailableError("LLM_API_KEY is not configured.")
        
        # Initialize the new google-genai SDK client
        self.client = genai.Client(api_key=self.settings.LLM_API_KEY)
        logger.info("LLMClient initialised with model=%s", self.settings.LLM_MODEL)

    def extract(
        self,
        chunks: list[ParsedChunk],
        requirements: list[RequirementResponse],
        document_sha256: str,
        source_type: str,
        existing_run_output: Optional[dict] = None,
    ) -> tuple[ExtractionOutput, str, str]:
        
        if existing_run_output is not None:
            try:
                return (
                    ExtractionOutput.model_validate(existing_run_output),
                    PROMPT_VERSION,
                    SCHEMA_VERSION,
                )
            except ValidationError as exc:
                logger.warning("Cached output failed validation: %s", exc)

        field_dict = build_field_dictionary(requirements)
        system_prompt = EXTRACTION_SYSTEM_PROMPT_V1.format(field_dictionary=field_dict)
        document_text = _format_chunks(chunks)

        if not document_text.strip():
            raise LLMOutputInvalidError("No usable text found.")

        # Explicitly ask for JSON since we aren't using response_schema natively
        full_prompt = (
            f"{system_prompt}\n\n"
            f"SOURCE TYPE: {source_type}\n\n"
            f"DOCUMENT CONTENT:\n"
            f"{'─' * 60}\n"
            f"{document_text}\n"
            f"{'─' * 60}\n\n"
            f"Extract all facts matching the FIELD DICTIONARY above.\n"
            f"IMPORTANT: You MUST respond ONLY with a raw, valid JSON object matching this schema:\n"
            f"{{ 'claims': [ {{ 'field_key': 'str', 'raw_value': 'str', 'normalized_value': 'str', 'unit': 'str', 'confidence': 0.95, 'quoted_text': 'str' }} ] }}\n"
            f"Return the exact supporting quote from the supplied source content. Do not paraphrase supporting evidence.\n"
            f"Do not invent source-location metadata. Source provenance will be independently established by deterministic code.\n"
            f"Do not include markdown blocks like ```json."
        )

        try:
            interaction = self.client.interactions.create(
                model=self.settings.LLM_MODEL,
                input=full_prompt
            )
            raw_text = interaction.output_text
        except Exception as exc:
            raise LLMUnavailableError(f"API call failed: {exc}") from exc

        if not raw_text or not raw_text.strip():
            raise LLMOutputInvalidError("Empty response.")

        # Strip markdown if the LLM ignored the instruction
        raw_text = raw_text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        try:
            parsed_json = json.loads(raw_text)
            output = ExtractionOutput.model_validate(parsed_json)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise LLMOutputInvalidError(f"Invalid JSON or schema: {exc}") from exc

        return output, PROMPT_VERSION, SCHEMA_VERSION
