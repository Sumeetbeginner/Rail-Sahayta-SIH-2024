"""
Seat Damage Routes - LLM-based seat damage severity analysis
Replaces: mlserver/views/seat_routes.py
"""

from flask import Blueprint, request, jsonify
import logging

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator,
    image_to_base64,
    create_placeholder_image
)

logger = logging.getLogger(__name__)
api_routes_seat = Blueprint("api_routes_seat", __name__)


@api_routes_seat.route("/seat_priority", methods=["POST"])
def seat_priority():
    """
    Analyze seat damage severity using LLM.

    Request: multipart/form-data with 'image' file
    Response: {"severity": int, "overlayed_image": base64_string}
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    try:
        image_file = request.files['image']
        image_data = image_file.read()

        # Convert image to base64 for LLM
        img_base64, mime_type = image_to_base64(image_data)

        # Get LLM router
        llm = get_llm_router()

        # Build prompt for seat damage analysis
        prompt = prompt_builder.seat_damage_analysis()

        # Call LLM vision API
        response = llm.vision_completion(prompt, img_base64, mime_type)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.severity_fallback(),
            required_keys=["severity"],
            retry_fn=lambda: llm.vision_completion(prompt, img_base64, mime_type),
            max_retries=1
        )

        # Get severity value (ensure it's an integer 0-4)
        severity = result.get("severity", 0)
        if isinstance(severity, str):
            try:
                severity = int(severity)
            except ValueError:
                severity = 0
        severity = max(0, min(4, int(severity)))

        # Create a placeholder overlayed image since we can't do actual CV processing
        # In production, you might return the original image or a simple annotated version
        overlayed_image = create_placeholder_image(
            width=400,
            height=300,
            text=f"Severity: {severity}"
        )

        # If original image is preferred, use:
        # overlayed_image = img_base64

        return jsonify({
            "severity": severity,
            "overlayed_image": overlayed_image
        }), 200

    except Exception as e:
        logger.error(f"Seat priority analysis error: {e}")
        return jsonify({"error": str(e)}), 500
