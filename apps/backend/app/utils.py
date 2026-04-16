from dotenv import load_dotenv
from fastapi import (
    HTTPException,
    status,
    UploadFile
)
import magic
import filetype
from bson.objectid import ObjectId

load_dotenv()

allowed_video_types = ["video/mp4", "video/webm", "video/quicktime"]
allowed_image_types = ["image/jpeg", "image/png", "image/gif"]

allowed_types = {
    "video": allowed_video_types,
    "image": allowed_image_types
}


def valid_id(id):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid ID")

async def validate_file(
    file: UploadFile,
    expected_types: str
):
    max_file_size_bytes = 10 * 1024 * 1024

    if file is None:
        return
    
    contents = await file.read()
    await file.seek(0)
    

    if len(contents) > max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{expected_types} file size exceeds the 10MB limit."
        )
    
    
    # mime = magic.from_buffer(contents[:2048], mime=True)
    # if not mime.startswith(expected_types):
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail=f"Invalid {expected_types} file type: {mime}."
    #     )
    
    # return mime

    kind = filetype.guess(contents)
    if kind is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not determine {expected_types} file type."
        )

    allowed = allowed_types.get(expected_types, [])
    if kind.mime not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {expected_types} type: {kind.mime}. Allowed: {allowed}"
        )

    return kind.mime


def replace_service_id(service):
    service["id"] = str(service["_id"])
    del service["_id"]
    return service

def replace_user_id(user):
    user["id"] = str(user["_id"])
    del user["_id"]
    return user