"""
Complaint Severity Routes - LLM-based complaint image analysis
Replaces: mlserver/views/comp_routes.py
"""

from flask import Blueprint, request, jsonify
import logging
import json

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator,
    image_to_base64,
    create_placeholder_image
)

logger = logging.getLogger(__name__)
api_routes_comp = Blueprint("api_routes_comp", __name__)


# Complaint categories for detection
COMPLAINT_CATEGORIES = [
    "damaged_seat", "damaged_window", "dirty_floor", "overflowing_dustbin",
    "broken_fan", "damaged_berth", "torn_curtain", "dirty_toilet",
    "broken_door", "damaged_handle", "scratched_wall", "broken_light",
    "damaged_mirror", "broken_rack", "dirty_sink", "stained_sheet",
    "broken_charging_point", "damaged_ac_vent", "broken_footrest",
    "other_damage"
]


@api_routes_comp.route("/comp_severity", methods=["POST"])
def comp_severity():
    """
    Analyze complaint image for multiple issues using LLM.

    Request: multipart/form-data with 'image' file
    Response: {"image": base64_string, "predictions": [array of detections]}
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

        # Build prompt for comprehensive complaint analysis
        prompt = f"""{prompt_builder.JSON_INSTRUCTION}

Analyze this railway complaint image and detect ALL issues present.

For each issue found, provide:
- label: The type of issue (from: {', '.join(COMPLAINT_CATEGORIES[:10])}, etc.)
- score: Confidence score (0.0-1.0)
- box: Approximate bounding box [x1, y1, x2, y2] as percentage of image (0-100)

Return JSON format:
{{
    "detections": [
        {{"label": "<issue_type>", "score": <0.0-1.0>, "box": [x1, y1, x2, y2]}},
        ...
    ],
    "overall_severity": "<low/medium/high/critical>"
}}

If no issues are found, return empty detections array."""

        # Call LLM vision API
        response = llm.vision_completion(prompt, img_base64, mime_type)

        # Parse response
        fallback = {"detections": [], "overall_severity": "low"}
        result = response_validator.validate_and_parse(
            response,
            fallback=fallback,
            required_keys=["detections"],
            retry_fn=lambda: llm.vision_completion(prompt, img_base64, mime_type),
            max_retries=1
        )

        # Convert detections to predictions format matching original API
        detections = result.get("detections", [])
        predictions = []

        for det in detections:
            if isinstance(det, dict):
                # Convert percentage box to pixel-like values (assuming 800x600 image)
                box = det.get("box", [0, 0, 100, 100])
                if len(box) == 4:
                    # Scale from percentage to pseudo-pixel coordinates
                    box = [int(b * 8) for b in box[:2]] + [int(b * 6) for b in box[2:4]]

                predictions.append({
                    "box": box,
                    "label": det.get("label", "unknown"),
                    "score": float(det.get("score", 0.5))
                })

        # Filter by threshold
        threshold = 0.1
        filtered_predictions = [p for p in predictions if p["score"] > threshold]

        # Return original image as annotated (or create placeholder)
        # Since we can't do actual CV annotation, we return the original
        annotated_image = img_base64

        return jsonify({
            "image": annotated_image,
            "predictions": filtered_predictions
        }), 200

    except Exception as e:
        logger.error(f"Complaint severity error: {e}")
        return jsonify({"error": str(e)}), 500
