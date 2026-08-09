"""
File Storage — Module 2.1b

Handles saving uploaded files securely to the disk and computing hashes.
"""

import hashlib
import os
import uuid
import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings

async def save_file(file: UploadFile, extension: str) -> tuple[str, str]:
    """
    Saves the file to the configured UPLOAD_DIR with a safe UUID name.
    
    Args:
        file: The FastAPI UploadFile.
        extension: The validated file extension (e.g. '.pdf').
        
    Returns:
        tuple[str, str]: (absolute_file_path, sha256_hash)
    """
    upload_dir = get_settings().UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{extension}"
    filepath = os.path.abspath(os.path.join(upload_dir, filename))
    
    sha256 = hashlib.sha256()
    
    # Read and save in chunks to prevent high memory usage on large files
    async with aiofiles.open(filepath, 'wb') as out_file:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            sha256.update(chunk)
            await out_file.write(chunk)
            
    # Reset file pointer just in case it's used again in the request lifecycle
    await file.seek(0)
    
    return filepath, sha256.hexdigest()
