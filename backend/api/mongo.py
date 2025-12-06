from pymongo import MongoClient
from django.conf import settings

client = MongoClient(getattr(settings, 'MONGO_URI', 'mongodb://localhost:27017/'))
db = client['dawini_db']

# Export getters for collections (used in views/models)
def get_mongo_client():
    return client

def get_mongo_db():
    return db

def get_collection(name):
    return db[name]