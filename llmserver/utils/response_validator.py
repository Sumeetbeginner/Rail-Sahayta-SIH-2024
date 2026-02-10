"""
Response Validator - Validates and parses LLM JSON responses
"""

import json
import re
import logging
from typing import Dict, Any, Optional, Callable

logger = logging.getLogger(__name__)


class ResponseValidator:
    """
    Validates LLM responses and ensures they are valid JSON.
    Handles retry logic and fallback responses.
    """

    @staticmethod
    def extract_json(text: str) -> Optional[str]:
        """
        Extract JSON from text that might contain markdown or other content.
        """
        if not text:
            return None

        # Try direct parse first
        text = text.strip()
        if text.startswith('{') or text.startswith('['):
            return text

        # Remove markdown code blocks
        code_block_patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
            r'`([\s\S]*?)`'
        ]

        for pattern in code_block_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        # Try to find JSON object or array
        json_patterns = [
            r'(\{[\s\S]*\})',
            r'(\[[\s\S]*\])'
        ]

        for pattern in json_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        return text

    @staticmethod
    def parse_json(text: str) -> Optional[Dict]:
        """
        Parse JSON from text, handling common issues.
        """
        extracted = ResponseValidator.extract_json(text)
        if not extracted:
            return None

        try:
            return json.loads(extracted)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")

            # Try fixing common issues
            fixed = extracted

            # Fix trailing commas
            fixed = re.sub(r',\s*}', '}', fixed)
            fixed = re.sub(r',\s*]', ']', fixed)

            # Fix single quotes
            fixed = fixed.replace("'", '"')

            # Fix unquoted keys (simple cases)
            fixed = re.sub(r'(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', fixed)

            try:
                return json.loads(fixed)
            except json.JSONDecodeError:
                logger.error(f"Could not parse JSON even after fixes: {text[:200]}")
                return None

    @staticmethod
    def validate_and_parse(
        response: Dict,
        fallback: Dict,
        required_keys: list = None,
        retry_fn: Callable = None,
        max_retries: int = 1
    ) -> Dict:
        """
        Validate LLM response and parse JSON.

        Args:
            response: The raw response from LLM router
            fallback: Fallback response if parsing fails
            required_keys: List of required keys in the parsed JSON
            retry_fn: Function to call for retry (should return new response)
            max_retries: Maximum number of retries

        Returns:
            Parsed JSON dict or fallback
        """
        attempts = 0

        while attempts <= max_retries:
            if "error" in response:
                logger.error(f"LLM response error: {response['error']}")
                if retry_fn and attempts < max_retries:
                    attempts += 1
                    logger.info(f"Retrying... attempt {attempts}")
                    response = retry_fn()
                    continue
                return fallback

            if "text" not in response:
                logger.error("No text in response")
                return fallback

            parsed = ResponseValidator.parse_json(response["text"])

            if parsed is None:
                if retry_fn and attempts < max_retries:
                    attempts += 1
                    logger.info(f"JSON parse failed, retrying... attempt {attempts}")
                    response = retry_fn()
                    continue
                logger.warning("Returning fallback due to parse failure")
                return fallback

            # Check required keys
            if required_keys:
                missing = [k for k in required_keys if k not in parsed]
                if missing:
                    logger.warning(f"Missing required keys: {missing}")
                    # Add missing keys from fallback
                    for key in missing:
                        if key in fallback:
                            parsed[key] = fallback[key]

            return parsed

        return fallback

    @staticmethod
    def image_classification_fallback() -> Dict:
        """Default fallback for image classification."""
        return {
            "predicted_class": "other",
            "confidence": 0.0
        }

    @staticmethod
    def severity_fallback() -> Dict:
        """Default fallback for severity analysis."""
        return {
            "severity": 0,
            "description": "Unable to analyze image"
        }

    @staticmethod
    def window_severity_fallback() -> Dict:
        """Default fallback for window severity analysis."""
        return {
            "status": 0,
            "message": "Image processed successfully"
        }

    @staticmethod
    def ocr_fallback() -> Dict:
        """Default fallback for OCR extraction."""
        return {
            "Detected Text": "",
            "Extracted Information": {
                "train_number": None,
                "pnr": None,
                "station": None,
                "date": None,
                "other_details": []
            }
        }

    @staticmethod
    def text_category_fallback() -> Dict:
        """Default fallback for text categorization."""
        return {
            "category": "management",
            "subcategory": "general"
        }

    @staticmethod
    def text_subcategory_fallback() -> Dict:
        """Default fallback for text sub-categorization."""
        return {
            "subcategory": "general"
        }

    @staticmethod
    def sentiment_fallback() -> Dict:
        """Default fallback for sentiment analysis."""
        return {
            "processed_feedback": "",
            "time_and_actions": {"time_references": [], "actions": []},
            "central_idea": "Unable to analyze",
            "sentiment_score": 0.0,
            "improvement_area": "unknown"
        }

    @staticmethod
    def translation_fallback(original_text: str) -> Dict:
        """Default fallback for translation."""
        return {
            "original_text": original_text,
            "translated_text": original_text,
            "source_language": "unknown"
        }

    @staticmethod
    def complaint_severity_fallback() -> Dict:
        """Default fallback for complaint severity."""
        return {
            "image": "",
            "predictions": []
        }

    @staticmethod
    def video_analysis_fallback() -> Dict:
        """Default fallback for video analysis."""
        return {
            "type": "video",
            "predicted_class": "other",
            "transcription": "",
            "hindi_text": "",
            "confidence": 0.0
        }


# Singleton instance
response_validator = ResponseValidator()
