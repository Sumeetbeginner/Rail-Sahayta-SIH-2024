"""
Image Category Routes - LLM-based image/video classification
Replaces: mlserver/views/img_category_routes.py
"""

from flask import Blueprint, request, jsonify, send_from_directory
import os
import logging
import tempfile

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator,
    image_to_base64,
    is_video_file,
    CLOUD_STORAGE_FOLDER
)

logger = logging.getLogger(__name__)
api_routes_img_category = Blueprint("api_routes_img_category", __name__)

# Ensure cloud storage folder exists
os.makedirs(CLOUD_STORAGE_FOLDER, exist_ok=True)


@api_routes_img_category.route('/predictimage', methods=['POST'])
def predict_image():
    """
    Classify image into railway complaint category using LLM.

    Request: multipart/form-data with 'image' file
    Response: {"predicted_class": str, "confidence": float}
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

        # Build prompt for image classification
        prompt = prompt_builder.image_classification()

        # Call LLM vision API
        response = llm.vision_completion(prompt, img_base64, mime_type)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.image_classification_fallback(),
            required_keys=["predicted_class", "confidence"],
            retry_fn=lambda: llm.vision_completion(prompt, img_base64, mime_type),
            max_retries=1
        )

        # Normalize confidence
        confidence = result.get("confidence", 0.0)
        if isinstance(confidence, str):
            try:
                confidence = float(confidence)
            except ValueError:
                confidence = 0.0
        confidence = max(0.0, min(1.0, float(confidence)))

        return jsonify({
            "predicted_class": result.get("predicted_class", "other"),
            "confidence": confidence
        }), 200

    except Exception as e:
        logger.error(f"Image prediction error: {e}")
        return jsonify({"error": str(e)}), 500


@api_routes_img_category.route('/predictvideo', methods=['POST'])
def process_video():
    """
    Classify video content using LLM.
    Note: Without heavy ML libraries, video processing is limited.
    This implementation analyzes video metadata and first frame if possible.

    Request: multipart/form-data with 'file' (video file)
    Response: {"type": "video", "predicted_class": str, "transcription": str, "hindi_text": str, "confidence": float}
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    file_name = file.filename.lower()

    # Check the file extension
    if not is_video_file(file_name):
        return jsonify({"error": "Unsupported file format"}), 400

    try:
        # Get LLM router
        llm = get_llm_router()

        # Since we can't process video without heavy libraries,
        # we'll create a text-based analysis request
        prompt = f"""{prompt_builder.JSON_INSTRUCTION}

This is a video file analysis request for a railway complaint system.
Video filename: {file_name}

Based on the filename and context of a railway complaint system, suggest:
1. Most likely category of complaint
2. Typical scenarios for such videos

Categories: damage_seat, damage_window, food, unhygenic_compartment, 
unhygenic_toilet, violence, management, ticketing_issue, security, electricity, medical, other

Return JSON format:
{{
    "predicted_class": "<most likely category>",
    "confidence": <0.0-1.0>,
    "transcription": "<note about video processing limitation>",
    "hindi_text": ""
}}"""

        response = llm.text_completion(prompt)

        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.video_analysis_fallback(),
            required_keys=["predicted_class"],
            max_retries=1
        )

        # Add note about limited video processing
        transcription = result.get("transcription", "")
        if not transcription:
            transcription = "Video transcription requires additional audio processing capabilities."

        return jsonify({
            "type": "video",
            "predicted_class": result.get("predicted_class", "other"),
            "transcription": transcription,
            "hindi_text": result.get("hindi_text", ""),
            "confidence": float(result.get("confidence", 0.5))
        }), 200

    except Exception as e:
        logger.error(f"Video processing error: {e}")
        return jsonify({"error": str(e)}), 500


@api_routes_img_category.route('/upload', methods=['POST'])
def upload_image():
    """
    Upload an image to cloud storage.

    Request: multipart/form-data with 'image' file
    Response: {"image_path": str}
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image = request.files['image']
    if image.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Save the image file
        image_path = os.path.join(CLOUD_STORAGE_FOLDER, image.filename)
        image.save(image_path)

        return jsonify({
            "image_path": f"/get_image/{image.filename}"
        }), 201

    except Exception as e:
        logger.error(f"Image upload error: {e}")
        return jsonify({"error": str(e)}), 500


@api_routes_img_category.route('/get_image/<filename>', methods=['GET'])
def get_image(filename):
    """
    Retrieve uploaded image from cloud storage.

    Response: Image file
    """
    try:
        return send_from_directory(CLOUD_STORAGE_FOLDER, filename)
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404
