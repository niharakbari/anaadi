# pyrefly: ignore [missing-import]
from flask import Blueprint, jsonify, request, current_app
from services.search_service import SearchService
import os
import uuid
from werkzeug.utils import secure_filename

search_bp = Blueprint("search", __name__)
search_service = SearchService()

@search_bp.route("/search", methods=["POST"])
def search_endpoint():
    # Validate image field exists in multipart/form-data
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image field in request"
        }), 400

    file = request.files["image"]

    # Validate filename is not empty
    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "No selected file"
        }), 400

    # Get upload folder configuration and create directory if missing
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "temp")
    os.makedirs(upload_folder, exist_ok=True)

    # Generate a unique filename to prevent overwriting
    original_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    saved_image_path = os.path.join(upload_folder, unique_filename)

    # Save the image
    file.save(saved_image_path)

    # Call SearchService with the saved image path
    search_result = search_service.perform_search(saved_image_path)
    return jsonify(search_result)

