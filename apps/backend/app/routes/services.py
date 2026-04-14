from fastapi import (
    APIRouter, 
    Depends, 
    File, 
    Form,
    HTTPException,
    status,
    Request,
    UploadFile
)
from typing import Annotated
from enum import Enum
from dependencies.authn import is_authenticated
from db import services_collection
import pandas as pd
from utils import validate_file, replace_service_id
import cloudinary.uploader

services_router = APIRouter(tags=["Services"])

services = {}

class ServiceType(str, Enum):
    BRAIDING = "Braiding"
    LASH = "Lash"
    TRAINING = "Training"
    PIERCINGS = "Piercings"
    EXTRAS = "Extras"

def load_service_mapping(file_path: str):
    df = pd.read_excel(file_path)
    mapping = {}

    for main_cat, group in df.groupby("MAIN CAT"):
        mapping[main_cat] = group["SUB CAT"].tolist()
    return mapping

@services_router.get("/services/categories")
async def get_categories(request: Request):
    services = getattr(request.app.state, "services", None)
    if not services:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Services not loaded"
        )
    return services


@services_router.post("/services")
async def upload_service(
    request: Request,
    title: Annotated[str, Form()],
    user_id: Annotated[str, Depends(is_authenticated)],
    price: Annotated[float, Form()],
    service: ServiceType,
    sub_category: Annotated[str, Form()],
    description: Annotated[str | None, Form()] = None,
    image: UploadFile = File(),
    video: UploadFile = File(None),
):
    service_count = services_collection.count_documents(filter={"$and": [
        {"title": title},
    ]})
    if service_count > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"Service with title: {title} already exist!")
    
    available_services = getattr(request.app.state, "services", None)
    if not available_services:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Services not loaded"
        )
    
    valid_subs = available_services.get(service.value)
    if sub_category not in valid_subs:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Invalid sub-category: {sub_category} for service: {service.value}"
        )
    
    if service not in available_services:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Invalid service: {service.value}"
        )
    
    if video:
        await validate_file(video, "video")

    try:
        image_upload = cloudinary.uploader.upload(image)
        image_url = image_upload.get("secure_url")

        video_upload = cloudinary.uploader.upload(video)
        video_url = video_upload.get("secure_url") if video else None
    except Exception as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File upload failed: {str(e)}"
        )
    
    services_collection.insert_one({
        "title": title,
        "user_id": user_id,
        "price": price,
        "service": service.value,
        "sub_category": sub_category,
        "description": description,
        "image_url": image_url,
        "video_url": video_url,
    })

    return {
        "message": "Service uploaded successfully"
    }