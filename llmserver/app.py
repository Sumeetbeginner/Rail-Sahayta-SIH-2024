"""
LLMServer - Lightweight ML Server using LLM APIs

A fallback replacement for mlserver that uses FREE LLM APIs instead of
heavy ML models (TensorFlow, Torch, PaddleOCR, Spacy, etc.)

Supported providers:
- Google Gemini (via Google AI Studio API)
- Mistral API
- Cerebras API
- Groq (for open models)

Set LLM_PROVIDER environment variable to switch between providers:
LLM_PROVIDER=gemini | mistral | cerebras | groq
"""

import os
import sys
import logging
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import route blueprints
from routes import (
    api_routes_seat,
    api_routes_win,
    api_routes_violence,
    api_routes_ocr,
    api_routes_text_catg,
    api_route_translate,
    api_routes_feedback,
    api_routes_comp,
    api_routes_img_category
)

from services import get_llm_router


class Config:
    """Application configuration."""
    VERSION = os.getenv('API_VERSION', 'v1')
    PORT = int(os.getenv('PORT', 9898))
    DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS Configuration - Production and Development URLs
    cors_origins = [
        'https://railsahayta.neuramaps.in',
        'https://rail-sahayta-final-1.onrender.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ]
    
    # Add any additional origins from environment variable
    if os.getenv('CORS_ORIGINS'):
        cors_origins.extend(os.getenv('CORS_ORIGINS').split(','))

    # Configure CORS
    CORS(app, supports_credentials=True, resources={
        r"/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    # Register blueprints with same URL prefixes as original mlserver
    version = Config.VERSION

    app.register_blueprint(api_routes_seat, url_prefix=f"/{version}/severity")
    app.register_blueprint(api_routes_win, url_prefix=f"/{version}/severity")
    app.register_blueprint(api_routes_feedback, url_prefix=f"/{version}/review_analysis")
    app.register_blueprint(api_routes_text_catg, url_prefix=f"/{version}/text")
    app.register_blueprint(api_routes_violence, url_prefix=f"/{version}/violence")
    app.register_blueprint(api_routes_ocr, url_prefix=f"/{version}/ocr")
    app.register_blueprint(api_routes_comp, url_prefix=f"/{version}/severity")
    app.register_blueprint(api_routes_img_category, url_prefix=f"/{version}")
    app.register_blueprint(api_route_translate, url_prefix=f"/{version}")

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        llm = get_llm_router()
        provider_info = llm.get_provider_info()
        return jsonify({
            "status": "healthy",
            "service": "llmserver",
            "version": version,
            "llm_provider": provider_info
        }), 200

    # Provider info endpoint
    @app.route('/provider', methods=['GET'])
    def provider_info():
        """Get current LLM provider information."""
        llm = get_llm_router()
        return jsonify(llm.get_provider_info()), 200

    # Forecast endpoint (simplified version - returns static data)
    @app.route('/v1/forecast', methods=['POST'])
    def forecast_api():
        """
        Forecast endpoint - simplified version.
        The original uses ARIMA models which require heavy dependencies.
        This returns a placeholder response.
        """
        data = request.json
        department = data.get('department')

        if not department:
            return jsonify({"error": "Please provide a department."}), 400

        # Return placeholder response
        # In production, this could use LLM for trend analysis
        return jsonify({
            "message": "Forecasting requires time-series data analysis",
            "department": department,
            "note": "This lightweight server doesn't include ARIMA forecasting. Use the original mlserver for forecasting features."
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Server error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled exception: {e}")
        return jsonify({"error": str(e)}), 500

    logger.info(f"Routes configured with prefix: /{version}")
    logger.info(f"LLM Provider: {os.getenv('LLM_PROVIDER', 'gemini')}")

    return app


def main():
    """Main entry point."""
    app = create_app()

    # Validate LLM provider configuration
    llm = get_llm_router()
    if not llm.service.is_available():
        logger.warning("=" * 60)
        logger.warning(f"WARNING: LLM Provider '{llm.provider_name}' is not configured!")
        logger.warning("Please set the appropriate API key in .env file.")
        logger.warning("=" * 60)

    logger.info(f"Starting LLMServer on {Config.HOST}:{Config.PORT}")
    logger.info(f"Debug mode: {Config.DEBUG}")

    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )


if __name__ == '__main__':
    main()
