import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 5000))
