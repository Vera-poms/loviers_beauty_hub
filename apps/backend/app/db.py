from pymongo import MongoClient
import os

#Connect to Mongo Atlas Cluster
mongo_client = MongoClient(os.getenv("MONGO_URI"))

# Access database
loviers_beauty_db = mongo_client["loviers_beauty_db"]

# Pick a connection to operate on
main_services_collection = loviers_beauty_db["main_services"]
sub_services_collection = loviers_beauty_db["sub_services"]
users_collection = loviers_beauty_db["users"]