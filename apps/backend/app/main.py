from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import cloudinary
from routes.services import services_router
from routes.auth import auth_router
from routes.appointments import appointments_router
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd
from contextlib import asynccontextmanager

load_dotenv()

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "loviers_services.csv")
uri = os.getenv("MONGO_URI")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongodb_client = AsyncIOMotorClient(uri)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found at: {csv_path}")

    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

   
    required_cols = {"MAIN CAT", "SUB CAT"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing expected columns: {missing}. Found: {list(df.columns)}")

    app.state.services = df.groupby("MAIN CAT")["SUB CAT"].apply(list).to_dict()

    yield

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET"),
)

app = FastAPI(title="Loviers Beauty Hub API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get("/")
def home():
    return {
        "message": "Welcome to Loviers Beauty Hub API!"
        }

app.include_router(auth_router)
app.include_router(services_router)
app.include_router(appointments_router)