import os
import time
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Request
from app.core.config import settings

router = APIRouter(prefix="/upload", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("/", status_code=status.HTTP_200_OK)
async def upload_files(
    request: Request,
    files: Optional[List[UploadFile]] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Production-ready file upload handler with MIME validation,
    size limitation, and sanitized unique file generation.
    Supports 'files', 'images', or single 'file' form fields.
    """
    upload_list: List[UploadFile] = []
    if files:
        upload_list.extend(files)
    if images:
        upload_list.extend(images)
    if file:
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded. Provide 'files', 'images', or 'file' in multipart/form-data."
        )

    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    saved_files = []
    urls = []

    for f in upload_list:
        # Check filename & extension
        orig_name = f.filename or "file.jpg"
        ext = os.path.splitext(orig_name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Check content type
        content_type = f.content_type or "application/octet-stream"
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported content type '{content_type}'. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
            )

        # Read content to check size
        content = await f.read()
        file_size = len(content)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{orig_name}' exceeds maximum size limit of 15MB."
            )
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{orig_name}' is empty."
            )

        # Generate unique sanitized filename
        unique_name = f"sai-{int(time.time())}-{uuid.uuid4().hex[:8]}{ext}"
        destination_path = os.path.join(settings.LOCAL_UPLOAD_DIR, unique_name)

        with open(destination_path, "wb") as buffer:
            buffer.write(content)

        # In production this can be absolute or relative URL
        base_url = str(request.base_url).rstrip("/")
        file_url = f"{base_url}/uploads/{unique_name}"
        urls.append(file_url)

        saved_files.append({
            "original_name": orig_name,
            "filename": unique_name,
            "url": file_url,
            "size": file_size,
            "content_type": content_type
        })

    return {
        "success": True,
        "urls": urls,
        "files": saved_files
    }
