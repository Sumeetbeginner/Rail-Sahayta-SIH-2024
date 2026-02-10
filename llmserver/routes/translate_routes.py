"""
Translation Routes - LLM-based text translation
Replaces: mlserver/views/translate_route.py
"""

from flask import Blueprint, request, jsonify
import logging

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator
)

logger = logging.getLogger(__name__)
api_route_translate = Blueprint("api_route_translate", __name__)


@api_route_translate.route("/translate", methods=["POST"])
def translate_to_english():
    """
    Translate text to English using LLM.

    Request: JSON with 'text' field
    Response: {"original_text": str, "translated_text": str, "source_language": str}
    """
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({"error": 'Missing "text" parameter'}), 400

        text = data['text']

        # Get LLM router
        llm = get_llm_router()

        # Build prompt for translation
        prompt = prompt_builder.translation(text)

        # System prompt
        system_prompt = """You are a professional translator.
Translate text accurately to English while preserving meaning.
Detect the source language automatically.
Always return valid JSON only."""

        # Call LLM text API
        response = llm.text_completion(prompt, system_prompt)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.translation_fallback(text),
            required_keys=["original_text", "translated_text", "source_language"],
            retry_fn=lambda: llm.text_completion(prompt, system_prompt),
            max_retries=1
        )

        return jsonify({
            "original_text": result.get("original_text", text),
            "translated_text": result.get("translated_text", text),
            "source_language": result.get("source_language", "unknown")
        }), 200

    except Exception as e:
        logger.error(f"Translation error: {e}")
        return jsonify({"error": str(e)}), 500
