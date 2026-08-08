"""
Structured logging + request ID propagation.

Rule: log IDs and states only — never secrets, never raw document content,
never PII. Every request gets a UUID attached to `request.state.request_id`
so it can be threaded through error envelopes and log lines for tracing.
"""

import logging
import sys
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def configure_logging(app_env: str) -> None:
    """Configure root logging once, at application startup."""
    level = logging.DEBUG if app_env == "local" else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s level=%(levelname)s logger=%(name)s msg=%(message)s"
        )
    )
    root = logging.getLogger("sourcesure")
    root.setLevel(level)
    root.handlers = [handler]
    root.propagate = False


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attaches a per-request UUID and logs method/path/status/duration only."""

    def __init__(self, app):
        super().__init__(app)
        self._logger = logging.getLogger("sourcesure.request")

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id
        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["x-request-id"] = request_id
        self._logger.info(
            "method=%s path=%s status=%s duration_ms=%s request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )
        return response
