# pyrefly: ignore [missing-import]
from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "success": True,
        "service": "Jewellery AI Service",
        "status": "Running",
        "version": "1.0.0"
    })
