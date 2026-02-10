"""
Text Categorization Routes - LLM-based text classification
Replaces: mlserver/views/text_catg_route.py
"""

from flask import Blueprint, request, jsonify
import logging

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator
)

logger = logging.getLogger(__name__)
api_routes_text_catg = Blueprint("api_routes_text_catg", __name__)


@api_routes_text_catg.route("/text_category", methods=["POST"])
def text_category():
    """
    Categorize complaint text using LLM (Cerebras API).

    Request: JSON with 'complaint' field
    Response: {"category": str, "subcategory": str}
    """
    try:
        data = request.json
        if not data or 'complaint' not in data:
            return jsonify({"error": "Complaint text is required"}), 400

        complaint = data['complaint']

        # Force use of Cerebras service
        from services.cerebras_service import CerebrasService
        llm = CerebrasService()

        if not llm.is_available():
            return jsonify({"error": "Cerebras API key not configured"}), 500

        # Build prompt for combined categorization and subcategorization
        prompt = prompt_builder.text_categorization_and_subcategory(complaint)

        # System prompt for consistent categorization
        system_prompt = """You are a railway complaint classifier.
Analyze complaints and categorize them accurately into predefined categories and subcategories.
Always return valid JSON only with category and subcategory fields."""

        # Call Cerebras API
        response = llm.text_completion(prompt, system_prompt)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback={"category": "management", "subcategory": "general"},
            required_keys=["category", "subcategory"],
            retry_fn=lambda: llm.text_completion(prompt, system_prompt),
            max_retries=1
        )

        # Valid categories from hierarchy
        valid_categories = [
            "seat", "window", "food", "compartment", "toilet",
            "violence", "management", "ticketing issue", "security",
            "electricity", "medical"
        ]

        category = result.get("category", "management")
        subcategory = result.get("subcategory", "general")

        # Normalize category
        category_lower = category.lower().replace("_", " ").replace("-", " ")
        for valid_cat in valid_categories:
            if valid_cat.lower() == category_lower:
                category = valid_cat
                break
        else:
            if category not in valid_categories:
                category = "management"

        return jsonify({"category": category, "subcategory": subcategory}), 200

    except Exception as e:
        logger.error(f"Text categorization error: {e}")
        return jsonify({"error": str(e)}), 500


@api_routes_text_catg.route("/text_subcategory", methods=["POST"])
def text_subcategory():
    """
    Determine complaint sub-category using LLM.

    Request: JSON with 'description' and 'category' fields
    Response: {"subcategory": str}
    """
    try:
        data = request.get_json()
        if not data or "description" not in data or "category" not in data:
            return jsonify({
                "error": "Invalid request. Please provide 'description' and 'category'."
            }), 400

        description = data["description"]
        category = data["category"]

        # Get LLM router
        llm = get_llm_router()

        # Build prompt for sub-categorization
        prompt = prompt_builder.text_subcategorization(description, category)

        # System prompt
        system_prompt = """You are a railway complaint classifier specialized in sub-categorization.
Given a complaint description and its main category, determine the most specific subcategory.
Always return valid JSON only."""

        # Call LLM text API
        response = llm.text_completion(prompt, system_prompt)

        # Validate and parse response
        result = response_validator.validate_and_parse(
            response,
            fallback=response_validator.text_subcategory_fallback(),
            required_keys=["subcategory"],
            retry_fn=lambda: llm.text_completion(prompt, system_prompt),
            max_retries=1
        )

        subcategory = result.get("subcategory", "general")

        return jsonify({"subcategory": subcategory}), 200

    except Exception as e:
        logger.error(f"Text sub-categorization error: {e}")
        return jsonify({"error": str(e)}), 500
