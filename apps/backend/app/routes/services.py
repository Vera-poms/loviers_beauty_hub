import json

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
from typing import Annotated, Optional, cast
from enum import Enum
from dependencies.authn import is_authenticated
from db import main_services_collection, sub_services_collection
import pandas as pd
from utils import validate_file, replace_service_id, valid_id
import cloudinary.uploader
from dependencies.authz import has_role
from bson.objectid import ObjectId
from pydantic import BaseModel, field_validator
from starlette.datastructures import UploadFile as StarletteUploadFile

services_router = APIRouter(tags=["Services"])

services = {}

class Addon(BaseModel):
    name: str
    price: float
 
    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float):
        if v < 0:
            raise ValueError("Addon price must be non-negative")
        return round(v, 2)
 
    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str):
        v = v.strip()
        if not v:
            raise ValueError("Addon name must not be empty")
        return v


class ServiceType(str, Enum):
    BRAIDING = "Braiding"
    LASH = "Lash"
    TRAINING = "Training"
    PIERCINGS = "Piercings"
    EXTRAS = "Extras"

def parse_addons(raw: str | None) -> list[Addon]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="`addons` must be a valid JSON array string.",
        )
    if not isinstance(data, list):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="`addons` must be a JSON array.",
        )
    try:
        return [Addon(**item) for item in data]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid addon object: {exc}",
        )

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

@services_router.post("/services/main", dependencies=[Depends(has_role("admin"))])
async def upload_main_service(
    request: Request,
    user_id: Annotated[str, Depends(is_authenticated)]
):
    form = await request.form(max_part_size=10 * 1024 * 1024) 
    
    service_raw = form.get("service")
    braiding_hours = form.get("braiding_hours") or None
    duration = form.get("duration") or None
    image = form.get("image")
    video = form.get("video") or None
    try:
        service = ServiceType(service_raw)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid service: {service_raw}")
    
    service_count = main_services_collection.count_documents(filter={"$and": [
        {"service": service},
    ]})

    if service_count > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"Service already exist!")
    
    available_services = getattr(request.app.state, "services", None)
    if not available_services:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Services not loaded"
        )
    
    if service not in available_services:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Invalid service: {service.value}"
        )
    
    if not hasattr(image, "read"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image file is required")
    if video is not None and not hasattr(video, "read"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid video file")

    image = cast(StarletteUploadFile, image)
    video = cast(StarletteUploadFile, video) if video else None
    await validate_file(image, "image")
    if video:
        await validate_file(video, "video")

    image_bytes = await image.read()
    video_bytes = await video.read() if video else None

    try:
        image_upload = cloudinary.uploader.upload(image_bytes, resource_type="image")
        image_url = image_upload.get("secure_url")

        video_upload = cloudinary.uploader.upload(video_bytes, resource_type="video") if video_bytes else None
        video_url = video_upload.get("secure_url") if video_upload else None
    except Exception as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File upload failed: {str(e)}"
        )
    
    main_services_collection.insert_one({
        "user_id": user_id,
        "service": service.value,
        "image_url": image_url,
        "video_url": video_url,
        "braiding_hours": braiding_hours,
        "duration": duration
    })

    return {
        "message": "Service uploaded successfully"
    }

@services_router.patch("/services/main/{service_id}", dependencies=[Depends(has_role("admin"))])
async def update_main_service(
    request: Request,
    service_id,
    user_id: Annotated[str, Depends(is_authenticated)],
):
    form = await request.form(max_part_size=10 * 1024 * 1024) 
    
    service_raw = form.get("service")
    braiding_hours = form.get("braiding_hours") or None
    image = form.get("image")
    video = form.get("video") or None

    try:
        service = ServiceType(service_raw)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid service: {service_raw}")
    
    service_count = main_services_collection.find_one({
        "_id": ObjectId(service_id)
    })
    if not service_count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Service with id: {service_id} not found!")
    
    available_services = getattr(request.app.state, "services", None)
    if not available_services:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Services not loaded"
        )
    
    if service:
        if service not in available_services:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid service: {service}"
            )
    image = cast(StarletteUploadFile, image)
    video = cast(StarletteUploadFile, video) if video else None
    if image:
        if not hasattr(image, "read"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image file is required")
        await validate_file(image, "image")
    if video:
        if video is not None and not hasattr(video, "read"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid video file")
        await validate_file(video, "video")

    image_bytes = await image.read() if image else None
    video_bytes = await video.read() if video else None

    try:
        if image_bytes:
            image_upload = cloudinary.uploader.upload(image_bytes, resource_type="image")
            image_url = image_upload.get("secure_url")

        if video:
            video_upload = cloudinary.uploader.upload(video_bytes, resource_type="video") if video_bytes else None
            video_url = video_upload.get("secure_url") if video_upload else None
    except Exception as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File upload failed: {str(e)}"
        )
    
    main_services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {
            "user_id": user_id,
            "service": service or service_count["service"],
            "braiding_hours": braiding_hours or service_count["braiding_hours"],
            "image_url": image_url if image_bytes is not None else service_count["image_url"],
            "video_url": video_url if video_bytes is not None else service_count["video_url"],
        }
    })

    return {
        "message": "Service uploaded successfully"
    }

@services_router.get("/services/main")
def get_main_services(query="", limit=10, skip=0):
    services = main_services_collection.find(
        filter={
            "service": {"$regex": query, "$options": "i"},
        },
        limit=int(limit),
        skip=int(skip)
    ).to_list(length=int(limit))

    return {"data": list(map(replace_service_id, services))}

@services_router.delete("/services/main/{service_id}", dependencies=[Depends(has_role("admin"))])
def delete_main_service(
    user_id: Annotated[str, Depends(is_authenticated)],
    service_id
):
    valid_id(service_id)
    service = main_services_collection.find_one({
        "_id": ObjectId(service_id)})
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found!")

    main_services_collection.delete_one({"_id": ObjectId(service_id)})
    return {"message": "Service removed successfully"}

@services_router.get("/services/main/{service_id}", dependencies=[Depends(has_role("admin"))])
def get_one_main_service(service_id, user_id: Annotated[str, Depends(is_authenticated)]):
    valid_id(service_id)
    service = main_services_collection.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"data": replace_service_id(service)}

@services_router.post("/services/subcategory", dependencies=[Depends(has_role("admin"))])
async def upload_sub_service(
    request: Request,
    user_id: Annotated[str, Depends(is_authenticated)],
):
    form = await request.form(max_part_size=10 * 1024 * 1024) 
    
    service_raw = form.get("service")
    braiding_hours = form.get("braiding_hours") or None
    title = form.get("title") or None
    sub_category = form.get("sub_category") or None
    description = form.get("description") or None
    price = form.get("price") or None
    addons = cast(str, form.get("addons")) or None
    addons_required_raw = form.get("addons_required") or "false"
    addons_required = addons_required_raw == "true"
    image = form.get("image")
    video = form.get("video") or None

    try:
        service = ServiceType(service_raw)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid service: {service_raw}")
    
    parsed_addons = parse_addons(addons)
 
    if addons_required:
        if not parsed_addons:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"At least one addon is required when {addons_required} is True.",
            )
        
        price = None
    else:
        if price is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="`price` is required when `addons_required` is False.",
            )
        
    service_count = sub_services_collection.count_documents(filter={"$and": [
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
    
    if not hasattr(image, "read"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image file is required")
    if video is not None and not hasattr(video, "read"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid video file")

    image = cast(StarletteUploadFile, image)
    video = cast(StarletteUploadFile, video) if video else None
    
    await validate_file(image, "image")
    if video:
        await validate_file(video, "video")

    image_bytes = await image.read()
    video_bytes = await video.read() if video else None

    try:
        image_upload = cloudinary.uploader.upload(image_bytes, resource_type="image")
        image_url = image_upload.get("secure_url")

        video_upload = cloudinary.uploader.upload(video_bytes, resource_type="video") if video_bytes else None
        video_url = video_upload.get("secure_url") if video_upload else None
    except Exception as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File upload failed: {str(e)}"
        )
    
    sub_services_collection.insert_one({
        "title": title,
        "user_id": user_id,
        "price": f"{price:.2f}" if price is not None else None,
        "service": service.value,
        "addons_required": addons_required,
        "addons": [a.model_dump() for a in parsed_addons],
        # "duration": duration,
        "sub_category": sub_category,
        "description": description,
        "braiding_hours": braiding_hours,
        "image_url": image_url,
        "video_url": video_url,
    })

    return {
        "message": "Service uploaded successfully"
    }

@services_router.patch("/services/subcategory/{service_id}", dependencies=[Depends(has_role("admin"))])
async def update_sub_service(
    request: Request,
    service_id,
    user_id: Annotated[str, Depends(is_authenticated)],
):
    form = await request.form(max_part_size=10 * 1024 * 1024) 
    
    service_raw = form.get("service")
    braiding_hours = form.get("braiding_hours") or None
    title = form.get("title") or None
    sub_category = form.get("sub_category") or None
    description = form.get("description") or None
    price = form.get("price") or None
    addons = cast(str, form.get("addons")) or None
    addons_required_raw = form.get("addons_required") or "false"
    addons_required = addons_required_raw == "true"
    duration = form.get("duration") or None
    image = form.get("image")
    video = form.get("video") or None

    try:
        service = ServiceType(service_raw)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid service: {service_raw}")
    
    parsed_addons = parse_addons(addons)
 
    if addons_required:
        if not parsed_addons:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"At least one addon is required when `addons_required` is {addons_required}.",
            )
        price = None
    else:
        if price is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"`price` is required when `addons_required` is {addons_required}.",
            )
        
    service_count = sub_services_collection.find_one({
        "_id": ObjectId(service_id),
    })

    if not service_count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Service with id: {service_id} not found!")
    
    available_services = getattr(request.app.state, "services", None)
    if not available_services:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Services not loaded"
        )
    
    if service:
        valid_subs = available_services.get(service)
        if sub_category not in valid_subs:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid sub-category: {sub_category} for service: {service}"
            )
        
        if service not in available_services:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid service: {service}"
            )

    
    

    image = cast(StarletteUploadFile, image)
    video = cast(StarletteUploadFile, video) if video else None

    if image:
        if not hasattr(image, "read"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image file is required")
        await validate_file(image, "image")
    if video:
        if video is not None and not hasattr(video, "read"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid video file")
        await validate_file(video, "video")

    image_bytes = await image.read() if image else None
    video_bytes = await video.read() if video else None

    try:
        if image_bytes:
            image_upload = cloudinary.uploader.upload(image_bytes, resource_type="image")
            image_url = image_upload.get("secure_url")

        if video:
            video_upload = cloudinary.uploader.upload(video_bytes, resource_type="video") if video_bytes else None
            video_url = video_upload.get("secure_url") if video_upload else None
    except Exception as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File upload failed: {str(e)}"
        )
    
    sub_services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {
            "title": title or service_count["title"],
            "user_id": user_id,
            "price": f"{price:.2f}" if price is not None else service_count["price"],
            "service": service or service_count["service"],
            "addons_required": addons_required or service_count["addons_required"],
            "addons": [a.model_dump() for a in parsed_addons] if parsed_addons else service_count.get("addons", []),
            "sub_category": sub_category or service_count["sub_category"],
            "description": description or service_count["description"],
            "braiding_hours": braiding_hours or service_count["braiding_hours"],
            "image_url": image_url if image_bytes is not None else service_count["image_url"],
            "video_url": video_url if video_bytes is not None else service_count["video_url"],
        }
    })

    return {
        "message": "Service updated successfully"
    }

@services_router.get("/services/subcategory")
def get_sub_services(query="", limit=10, skip=0):
    services = sub_services_collection.find(
        filter={
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"service": {"$regex": query, "$options": "i"}},
                {"sub_category": {"$regex": query, "$options": "i"}},
            ],
        },
        limit=int(limit),
        skip=int(skip)
    ).to_list(length=int(limit))

    return {"data": list(map(replace_service_id, services))}

@services_router.delete("/services/subcategory/{service_id}", dependencies=[Depends(has_role("admin"))])
def delete_sub_service(
    user_id: Annotated[str, Depends(is_authenticated)],
    service_id
):
    valid_id(service_id)
    service = sub_services_collection.find_one({
        "_id": ObjectId(service_id)})
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found!")

    sub_services_collection.delete_one({"_id": ObjectId(service_id)})
    return {"message": "Service removed successfully"}

@services_router.get("/services/subcategory/{service_id}", dependencies=[Depends(has_role("admin"))])
def get_one_sub_service(service_id, user_id: Annotated[str, Depends(is_authenticated)]):
    valid_id(service_id)
    service = sub_services_collection.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"data": replace_service_id(service)}