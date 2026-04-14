from dotenv import load_dotenv
from fastapi import (
    HTTPException,
    status,
    UploadFile
)
import magic

load_dotenv()

allowed_video_types = ["video/mp4", "video/webm", "video/quicktime"]
allowed_image_types = ["image/jpeg", "image/png", "image/gif"]

async def validate_file(
    file: UploadFile,
    expected_types: str
):
    max_file_size_bytes = 10*1024*1024

    if file is None:
        return
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{expected_types} file size exceeds the 10MB limit."
        )
    
    header = await file.read(2048)
    await file.seek(0)
    mime = magic.from_buffer(header, mime=True)
    if not mime.startswith(expected_types):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {expected_types} file type: {mime}."
        )
    
    return mime


def replace_service_id(service):
    service["id"] = str(service["_id"])
    del service["_id"]
    return service

def replace_user_id(user):
    user["id"] = str(user["_id"])
    del user["_id"]
    return user