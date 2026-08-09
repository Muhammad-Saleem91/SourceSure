"""
File Validation — Module 2.1a

Ensures uploaded documents meet security and format requirements before saving.
"""

from fastapi import UploadFile
from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
}

async def validate_file(file: UploadFile) -> str:
    """
    Validates the uploaded file.
    
    Returns:
        The safe extension for this file (e.g., '.pdf')
        
    Raises:
        AppError: If the file is too large or unsupported.
    """
    # 1. Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise AppError(
            code=ErrorCode.VALIDATION_ERROR,
            message="Unsupported file type.",
            details={"allowed_types": list(ALLOWED_MIME_TYPES.values()), "provided": file.content_type},
            status_code=415
        )

    # 2. Check file size
    max_bytes = get_settings().MAX_UPLOAD_MB * 1024 * 1024
    
    # We must read chunk by chunk to check size without loading the whole file into RAM,
    # but for FastAPI UploadFile with spooled temp files, we can just seek to end.
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)  # reset pointer for actual saving later

    if file_size > max_bytes:
        raise AppError(
            code=ErrorCode.VALIDATION_ERROR,
            message=f"File exceeds maximum size of {get_settings().MAX_UPLOAD_MB}MB.",
            details={"size_bytes": file_size, "max_bytes": max_bytes},
            status_code=413
        )
        
    if file_size == 0:
        raise AppError(
            code=ErrorCode.VALIDATION_ERROR,
            message="File is empty.",
            status_code=400
        )

    return ALLOWED_MIME_TYPES[file.content_type]
