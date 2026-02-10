"""
Feedback Sentiment Routes - LLM-based sentiment analysis
Replaces: mlserver/views/feedback_routes.py
"""

from flask import Blueprint, request, jsonify
import logging

from services import get_llm_router
from utils import (
    prompt_builder,
    response_validator
)

logger = logging.getLogger(__name__)
api_routes_feedback = Blueprint("api_routes_feedback", __name__)


@api_routes_feedback.route("/feedback_sentiment", methods=["POST"])
def feedback_sentiment():
    """
    Analyze sentiment and extract insights from feedback using LLM.

    Request: JSON with 'feedbacks' array
    Response: {"status": str, "results": [array of analysis results]}
    """
    try:
        data = request.json
        feedbacks = data.get('feedbacks', [])

        if not feedbacks:
            return jsonify({
                "status": "success",
                "results": []
            }), 200

        # Get LLM router
        llm = get_llm_router()

        results = []

        for feedback in feedbacks:
            # Build prompt for sentiment analysis
            prompt = prompt_builder.sentiment_analysis(feedback)

            # System prompt
            system_prompt = """You are a sentiment analysis expert specializing in railway feedback.
Analyze feedback for sentiment, key themes, and improvement areas.
Return detailed but structured analysis as JSON only."""

            # Call LLM text API
            response = llm.text_completion(prompt, system_prompt)

            # Validate and parse response
            result = response_validator.validate_and_parse(
                response,
                fallback=response_validator.sentiment_fallback(),
                required_keys=["sentiment_score", "central_idea"],
                retry_fn=lambda: llm.text_completion(prompt, system_prompt),
                max_retries=1
            )

            # Ensure sentiment score is in valid range
            sentiment_score = result.get("sentiment_score", 0.0)
            if isinstance(sentiment_score, str):
                try:
                    sentiment_score = float(sentiment_score)
                except ValueError:
                    sentiment_score = 0.0
            sentiment_score = max(-1.0, min(1.0, float(sentiment_score)))

            # Build response matching original format
            analysis_result = {
                "original_feedback": feedback,
                "processed_feedback": result.get("processed_feedback", feedback),
                "time_and_actions": result.get("time_and_actions", {
                    "time_references": [],
                    "actions": []
                }),
                "central_idea": result.get("central_idea", ""),
                "sentiment_score": sentiment_score,
                "improvement_area": result.get("improvement_area", "general")
            }

            results.append(analysis_result)

        return jsonify({
            "status": "success",
            "results": results
        }), 200

    except Exception as e:
        logger.error(f"Feedback sentiment error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
