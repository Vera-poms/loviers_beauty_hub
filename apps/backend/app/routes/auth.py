from fastapi import APIRouter, Form
from db import users_collection
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Annotated
from enum import Enum
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone

auth_router = APIRouter(tags=["Users"])

class UserDetails(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserRole(str, Enum):
    ADMIN = "admin"
    OWNER = "owner"


@auth_router.post("/auth/signup")
def register_user(
        username: Annotated[str, Form()],
        email: Annotated[EmailStr, Form()],
        password: Annotated[str, Form()],
        role: Annotated[UserRole, Form()] = UserRole.ADMIN):

    user_count = users_collection.count_documents({"email": email})
    if user_count > 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "User already exists!")

    hash_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    user_created = {
        "username": username,
        "email": email,
        "password": hash_password,
        "role": role
    }

    registered_user = users_collection.insert_one(user_created)

    return {
        "message": "Signup successful"
    }

@auth_router.post("/auth/login")
def login_user(
    email: Annotated[EmailStr, Form()],
    password: Annotated[str, Form()]
):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found!")

    correct_password = bcrypt.checkpw(password.encode(), user["password"])
    if not correct_password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong credentials!")

    print(os.getenv("JWT_SECRET_KEY"))

    encoded_jwt = jwt.encode({
            "id": str(user["_id"]),
            "exp": datetime.now(tz=timezone.utc) + timedelta(minutes=60)
        }, os.getenv("JWT_SECRET_KEY"), os.getenv("JWT_ALGORITHM"))

    return {
        "message": "Login successful",
        "access_token": encoded_jwt,
        "role": user["role"]
    }