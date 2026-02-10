"""
Window Damage Routes - LLM-based window damage severity analysis
Replaces: mlserver/views/window_routes.py
"""

from flask import Blueprint, request, jsonify
import os
import logging

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator,
    image_to_base64,
    save_uploaded_file,
    cleanup_temp_files,
    UPLOAD_FOLDER
)

logger = logging.getLogger(__name__)
api_routes_win = Blueprint("api_routes_win", __name__)


@api_routes_win.route("/win_priority", methods=["POST"])
def win_priority():
    """
    Analyze window damage severity using LLM.

    Request: multipart/form-data with 'image' file
    Response: {"message": str, "status": int}
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['image']
    saved_path = None

    try:
        # Save file temporarily (matching original behavior)
        saved_path = save_uploaded_file(image_file, UPLOAD_FOLDER)

        # Read image data
        with open(saved_path, 'rb') as f:
            image_data = f.read()

        # Convert image to base64 for LLM
        img_base64, mime_type = image_to_base64(image_data)

        # Get LLM router
        llm = get_llm_router()

        # Build prompt for window damage analysis
        prompt = prompt_builder.window_damage_analysis()

        # Call LLM vision API
        response = llm.vision_completion(prompt, img_base64, mime_type)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.window_severity_fallback(),
            required_keys=["status"],
            retry_fn=lambda: llm.vision_completion(prompt, img_base64, mime_type),
            max_retries=1
        )

        # Get status value (ensure it's an integer 0-4)
        status = result.get("status", 0)
        if isinstance(status, str):
            try:
                status = int(status)
            except ValueError:
                status = 0
        status = max(0, min(4, int(status)))

        return jsonify({
            "message": "Image processed successfully",
            "status": status
        }), 200

    except Exception as e:
        logger.error(f"Window priority analysis error: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up saved file
        if saved_path:
            cleanup_temp_files(saved_path)
