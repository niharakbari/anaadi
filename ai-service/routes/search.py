from flask import Blueprint, jsonify, request
from services.search_service import SearchService

search_bp = Blueprint("search", __name__)
search_service = SearchService()


@search_bp.route("/search", methods=["POST"])
def search_endpoint():
    data = request.get_json(silent=True) or {}

    # Validate image_path is present and is a non-empty string
    if "image_path" not in data:
        return jsonify({
            "success": False,
            "message": "image_path is missing"
        }), 400

    image_path = data.get("image_path")
    if not isinstance(image_path, str) or not image_path.strip():
        return jsonify({
            "success": False,
            "message": "image_path must be a non-empty string"
        }), 400

    # Validate top_k: must be an integer between 1 and 100 (inclusive).
    # Defaults to 5 when the caller omits it.
    top_k = data.get("top_k", 5)
    if not isinstance(top_k, int) or top_k < 1 or top_k > 100:
        return jsonify({
            "success": False,
            "message": "top_k must be an integer between 1 and 100"
        }), 400

    result = search_service.perform_search(image_path=image_path, top_k=top_k)

    # Return 500 for unexpected internal failures, 200 for all successful
    # outcomes including empty result sets.
    if not result["success"]:
        return jsonify(result), 500
    return jsonify(result), 200


@search_bp.route("/search/<int:design_id>", methods=["DELETE"])
def delete_endpoint(design_id):
    result = search_service.delete_embedding(design_id)
    if not result["success"]:
        return jsonify(result), 500
    return jsonify(result), 200
