"""
Centralized error taxonomy.

Every business-rule failure in the system should raise `AppError` with one
of the codes below rather than a bare HTTPException — this keeps the error
envelope shape consistent for the frontend across every endpoint, and keeps
raw internals (stack traces, DB errors) out of client responses.
"""

import logging
import uuid
from enum import Enum
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("sourcesure")


class ErrorCode(str, Enum):
    """Stable, machine-readable error codes referenced by the frontend."""

    # --- Generic / infra -----------------------------------------------
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"

    # --- Case / requirement lifecycle -----------------------------------
    CASE_LOCKED = "CASE_LOCKED"
    STALE_INPUT_VERSION = "STALE_INPUT_VERSION"

    # --- Document ingestion (Phase 2) ------------------------------------
    DOCUMENT_UNSUPPORTED = "DOCUMENT_UNSUPPORTED"
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    CORRUPT_OR_ENCRYPTED = "CORRUPT_OR_ENCRYPTED"
    IMAGE_ONLY_PDF = "IMAGE_ONLY_PDF"

    # --- Extraction / LLM (Phase 2) ---------------------------------------
    LLM_UNAVAILABLE = "LLM_UNAVAILABLE"
    EXTRACTION_INVALID_OUTPUT = "EXTRACTION_INVALID_OUTPUT"

    # --- Eligibility / ranking (Phase 3-4) --------------------------------
    UNIT_MISMATCH = "UNIT_MISMATCH"
    SUPPLIER_NOT_ELIGIBLE = "SUPPLIER_NOT_ELIGIBLE"
    INVALID_WEIGHT_KEY = "INVALID_WEIGHT_KEY"


class AppError(Exception):
    """
    Application-level exception carrying a stable error code.

    Raise this from services/routers instead of HTTPException so every
    error in the system funnels through the same envelope shape.
    """

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


def error_envelope(
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Build the standard `{error: {code, message, details, request_id}}` body."""
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "request_id": request_id or str(uuid.uuid4()),
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Wire global exception handlers so no route ever leaks a raw traceback."""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.warning("app_error code=%s status=%s request_id=%s", exc.code, exc.status_code, request_id)
        return JSONResponse(
            status_code=exc.status_code,
            content=error_envelope(exc.code.value, exc.message, exc.details, request_id),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_envelope(
                ErrorCode.VALIDATION_ERROR.value,
                "Request validation failed.",
                {"errors": exc.errors()},
                request_id,
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content=error_envelope(ErrorCode.NOT_FOUND.value if exc.status_code == 404 else ErrorCode.INTERNAL_ERROR.value,
                                    str(exc.detail), None, request_id),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        # Log full detail server-side only; client gets a safe, generic message.
        logger.exception("unhandled_exception request_id=%s", request_id)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_envelope(
                ErrorCode.INTERNAL_ERROR.value,
                "An unexpected error occurred.",
                None,
                request_id,
            ),
        )
