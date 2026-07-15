from flask import Blueprint, jsonify
from routes.search import search_service

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    # Verify load state of dependencies
    openclip_loaded = search_service.embedding_service.model is not None
    faiss_loaded = search_service.faiss_service.index is not None
    total_indexed_images = search_service.faiss_service.index.ntotal if faiss_loaded else 0

    return jsonify({
        "success": True,
        "service": "Jewellery AI Service",
        "status": "Running",
        "version": "1.0.0",
        "details": {
            "openclip_loaded": openclip_loaded,
            "faiss_loaded": faiss_loaded,
            "total_indexed_images": total_indexed_images
        }
    })
