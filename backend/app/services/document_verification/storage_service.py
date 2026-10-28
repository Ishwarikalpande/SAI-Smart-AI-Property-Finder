import os
import hashlib
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 # 15 MB

SECURE_DOC_DIR = os.path.join(settings.LOCAL_UPLOAD_DIR, "secure_documents")
os.makedirs(SECURE_DOC_DIR, exist_ok=True)

def save_secure_document(file: UploadFile) -> Tuple[str, str, int, str]:
    """
    Saves an uploaded document securely to a private folder outside public web root.
    Returns: (stored_file_path, original_file_name, file_size, sha256_hash)
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        # Check by extension
        orig_name = file.filename or ""
        ext = os.path.splitext(orig_name)[1].lower()
        valid_exts = [".pdf", ".jpg", ".jpeg", ".png", ".webp"]
        if ext not in valid_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{content_type}'. Supported: PDF, JPG, JPEG, PNG, WEBP."
            )
        target_ext = ext
    else:
        target_ext = ALLOWED_MIME_TYPES[content_type]

    content = file.file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 15MB (got {file_size / (1024*1024):.1f}MB)."
        )

    # Calculate SHA-256 hash
    hasher = hashlib.sha256()
    hasher.update(content)
    file_hash = hasher.hexdigest()

    # Generate safe random filename
    safe_filename = f"doc_{uuid.uuid4().hex[:16]}_{file_hash[:8]}{target_ext}"
    dest_path = os.path.join(SECURE_DOC_DIR, safe_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    return dest_path, file.filename or "uploaded_document", file_size, file_hash

def get_document_file_path(relative_or_full_path: str) -> str:
    """Verifies and returns the full absolute path of the secure document."""
    if os.path.isabs(relative_or_full_path) and os.path.exists(relative_or_full_path):
        return relative_or_full_path
    
    candidate = os.path.join(SECURE_DOC_DIR, os.path.basename(relative_or_full_path))
    if os.path.exists(candidate):
        return candidate
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found on disk")
