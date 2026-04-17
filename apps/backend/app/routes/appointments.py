from datetime import date

from fastapi import (
    APIRouter, 
    File, 
    Form,
    HTTPException,
    status,
    Request,
    UploadFile
)
from typing import Annotated, Optional
from db import appointments_collection, sub_services_collection
from utils import (
    validate_file, 
    generate_verification_code, 
    check_network_prefix, 
    valid_id,
    replace_appointment_id
)
import cloudinary.uploader
from bson.objectid import ObjectId
from .services import ServiceType
from pydantic import EmailStr
import os
from dotenv import load_dotenv
from email.message import EmailMessage
import smtplib
import hashlib
from .services import parse_addons
from datetime import datetime, date

load_dotenv()


appointments_router = APIRouter(tags=["Appointments"])

smtp_host = os.environ["SMTP_HOST"]
smtp_port = int(os.environ["SMTP_PORT"])
smtp_username = os.environ["SMTP_USERNAME"]
smtp_password = os.environ["SMTP_PASSWORD"]

def send_confirmation_code(recipient: str, body: str):
    msg = EmailMessage()
    msg["Subject"] = "[Important] Confirmation Code"
    msg["From"] = "loviersbeautyhub@gmail.com"
    msg["To"] = recipient
    msg.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg=msg)
    except Exception as e:
        raise HTTPException(
            status.HTTP_417_EXPECTATION_FAILED,
            f"{e}"
        )

@appointments_router.post("/appointments/preview")
def booking_preview(
    serivice_id: Annotated[str, Form()],
    addons: list[str], 
    available_date: Annotated[str, Form()],
    available_time: Annotated[str, Form()],
):
    valid_id(serivice_id)
        
    service = sub_services_collection.find_one({"_id": ObjectId(serivice_id)})
    if not service:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Service not found"
        )

    parsed_date = datetime.strptime(available_date, "%d-%m-%Y").date()
    if parsed_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book appointments in the past"
        )

    
    available_addons = service.get("addons", [])
    selected_addons = [a for a in available_addons if a["name"] in addons]

    if not selected_addons:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="None of the selected addons are valid for this service"
        )

    addons_total = sum(float(a.get("price", 0)) for a in selected_addons)
    base_price = float(service.get("price", 0))
    total = base_price + addons_total

    return {
        "service": service.get("title"),
        "description": service.get("description"),
        "braiding_hours": service.get("braiding_hours"),
        "available_date": available_date,
        "available_time": available_time,
        "addons": selected_addons,
        "base_price": base_price,
        "addons_total": addons_total,
        "total": total,
    }
    

@appointments_router.post("/appointments")
async def book_appointment(request: Request,
    service: ServiceType,
    service_id: Annotated[str, Form()],
    sub_category: Annotated[str, Form()],
    name: Annotated[str, Form()],
    phone_number: Annotated[str, Form()],
    email: Annotated[EmailStr, Form()],
    time: Annotated[str, Form()],
    date: Annotated[str, Form()],
    addons: list[str] | None = None,
    price: Annotated[float | None, Form()] = None,
    notes: Annotated[str | None, Form()] = None,
    image: UploadFile = File(None),
    video: UploadFile = File(None),
):
    valid_id(service_id)
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
    
    valid_subs = available_services.get(service.value)
    if sub_category not in valid_subs:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Invalid sub-category: {sub_category} for service: {service.value}"
        )
    
    check_network_prefix(phone_number)
    
    if image:
        await validate_file(image, "image")
    if video:
        await validate_file(video, "video")

    image_bytes = await image.read() if image else None
    video_bytes = await video.read() if video else None

    try:
        if image_bytes:
            image_upload = cloudinary.uploader.upload(image_bytes, resource_type="image")
            image_url = image_upload.get("secure_url")

        if video_bytes:
            video_upload = cloudinary.uploader.upload(video_bytes, resource_type="video") if video_bytes else None
            video_url = video_upload.get("secure_url") if video_upload else None
    except Exception as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File upload failed: {str(e)}"
        )
    
    code = generate_verification_code(6)
    hashed_code = hashlib.sha256(code.encode()).hexdigest()
    
    body = f"""
    Use this code to confirm your appointment booking: {code}
    """
    send_confirmation_code(email, body)

    service_doc = sub_services_collection.find_one({"_id": ObjectId(service_id)})
    if not service_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Service ID {service_id} does not exist in our database."
        )
    available_addons = service_doc.get("addons", [])
    selected_addons = [a for a in available_addons if a["name"] in addons]

    if not selected_addons:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="None of the selected addons are valid for this service"
        )

    addons_total = sum(a["price"] for a in selected_addons)
    
    appointments_collection.insert_one({
        "service": service.value,
        "sub_category": sub_category,
        "name": name,
        "phone_number": phone_number,
        "email": email,
        "time": time,
        "date": date,
        "addons": selected_addons if addons else [],
        "addons_total": addons_total if addons else 0,
       "notes": notes,
        "image_url": image_url if image_bytes is not None else "",
        "video_url": video_url if video_bytes is not None else "",
        "confirmation_code": hashed_code
    })

    return {
        "message": "Appointment booked successfully and confirmation code sent to email."
    }

@appointments_router.get("/appointments/{appointment_id}")
async def get_appointment(appointment_id: str):
    valid_id(appointment_id)
    appointment = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Appointment not found"
        )
    return {"data": replace_appointment_id(appointment)}

@appointments_router.get("/appointments")
async def get_all_appointments(query="", name="", email="", limit=10, skip=0):
    appointment = appointments_collection.find(
        filter={
            "$or": [
                {"service": {"$regex": query, "$options": "i"}},
                {"sub_category": {"$regex": query, "$options": "i"}},
                {"name": {"$regex": name, "$options": "i"}},
                {"email": {"$regex": email, "$options": "i"}},
            ]
         },
        limit=int(limit),
        skip=int(skip)
    ).to_list(length=int(limit))
    
    return {"data": list(map(replace_appointment_id, appointment))}

  