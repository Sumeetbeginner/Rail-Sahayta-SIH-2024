"""
OCR Extraction Routes - LLM-based OCR text extraction
Replaces: mlserver/views/ocr_routes.py
"""

from flask import Blueprint, request, jsonify
import logging

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator,
    image_to_base64
)

logger = logging.getLogger(__name__)
api_routes_ocr = Blueprint("api_routes_ocr", __name__)


@api_routes_ocr.route("/ocr_extraction", methods=["POST"])
def ocr_extractions():
    """
    Extract text from image using LLM vision capabilities.

    Request: multipart/form-data with 'image' file
    Response: {"Detected Text": str, "Extracted Information": dict}
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    try:
        image_file = request.files['image']
        image_data = image_file.read()

        # Convert image to base64 for LLM (use higher resolution for OCR)
        img_base64, mime_type = image_to_base64(image_data, resize_max=2048)

        # Get LLM router
        llm = get_llm_router()

        # Build prompt for OCR extraction
        prompt = prompt_builder.ocr_extraction()

        # Call LLM vision API
        response = llm.vision_completion(prompt, img_base64, mime_type)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.ocr_fallback(),
            required_keys=["Detected Text", "Extracted Information"],
            retry_fn=lambda: llm.vision_completion(prompt, img_base64, mime_type),
            max_retries=1
        )

        # Ensure proper structure
        detected_text = result.get("Detected Text", "")
        extracted_info = result.get("Extracted Information", {})

        # Normalize extracted info structure
        if not isinstance(extracted_info, dict):
            extracted_info = {
                "train_number": None,
                "pnr": None,
                "station": None,
                "date": None,
                "other_details": []
            }

        return jsonify({
            "Detected Text": detected_text,
            "Extracted Information": extracted_info
        }), 200

    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return jsonify({"error": str(e)}), 500
