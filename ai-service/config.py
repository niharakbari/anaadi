import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    HOST = os.getenv("HOST", "localhost")
    PORT = int(os.getenv("PORT", 5000))
    # Set FLASK_DEBUG=true in .env only during local development.
    # Must NEVER be true in production.
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # OpenCLIP model configuration
    MODEL_NAME = os.getenv("MODEL_NAME", "ViT-B-32")
    PRETRAINED_WEIGHTS = os.getenv("PRETRAINED_WEIGHTS", "laion2b_s34b_b79k")
    # Embedding vector dimension produced by the selected model.
    # ViT-B-32 → 512. Change this if you switch to a different model (e.g. ViT-L-14 → 768).
    EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", 512))

    FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "index/faiss.index")
    DESIGN_LIBRARY_PATH = os.getenv("DESIGN_LIBRARY_PATH", "../backend/uploads/design_library")
