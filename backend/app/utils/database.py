from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client['shopnest_db']

users_collection = db['users']
chats_collection = db['chats']
messages_collection = db['messages']
faqs_collection = db['faqs']

def get_db():
    return db