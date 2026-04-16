from dotenv import load_dotenv
from fastapi import (
    HTTPException,
    status,
    UploadFile
)
import filetype
from bson.objectid import ObjectId
import secrets
import string

load_dotenv()

network_prefix = {
    "MTN": ["024", "054", "055", "059", "053"],
    "at": ["026", "056", "057", "027"],
    "telecel": ["020", "050"],
}
allowed_video_types = ["video/mp4", "video/webm", "video/quicktime"]
allowed_image_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]

allowed_types = {
    "video": allowed_video_types,
    "image": allowed_image_types
}

def check_network_prefix(phone_number):
    if not (len(phone_number) == 10 and phone_number.isdigit()):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid phone number format")
    
    prefix = phone_number[:3]
    detected_network = None
    for network, prefixes in network_prefix.items():
        if prefix in prefixes:
            detected_network = network
            break
    
    if not detected_network:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported network prefix")
    
    return detected_network

def generate_verification_code(length: int = 6):
    return ''.join(secrets.choice(string.digits) for _ in range(length))

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


def replace_appointment_id(appointment):
    appointment["id"] = str(appointment["_id"])
    del appointment["_id"]
    return appointment

def replace_service_id(service):
    service["id"] = str(service["_id"])
    del service["_id"]
    return service

def replace_user_id(user):
    user["id"] = str(user["_id"])
    del user["_id"]
    return user