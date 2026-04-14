from pymongo import MongoClient
import os

#Connect to Mongo Atlas Cluster
mongo_client = MongoClient(os.getenv("MONGO_URI"))

# Access database
loviers_beauty_db = mongo_client["loviers_beauty_db"]

# Pick a connection to operate on
services_collection = loviers_beauty_db["services"]
users_collection = loviers_beauty_db["users"]