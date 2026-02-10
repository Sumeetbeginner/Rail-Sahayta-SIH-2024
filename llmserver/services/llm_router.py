"""
LLM Router - Routes requests to the appropriate LLM provider
"""

import os
import logging
from typing import Optional

from .gemini_service import GeminiService
from .mistral_service import MistralService
from .cerebras_service import CerebrasService
from .groq_service import GroqService

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Routes LLM requests to the configured provider.
    Supports: gemini, mistral, cerebras, groq
    """

    PROVIDERS = {
        "gemini": GeminiService,
        "mistral": MistralService,
        "cerebras": CerebrasService,
        "groq": GroqService
    }

    def __init__(self):
        self.provider_name = os.getenv("LLM_PROVIDER", "gemini").lower()
        self.service = self._init_service()
        logger.info(f"LLM Router initialized with provider: {self.provider_name}")

    def _init_service(self):
        """Initialize the appropriate service based on provider name."""
        if self.provider_name not in self.PROVIDERS:
            logger.warning(f"Unknown provider '{self.provider_name}', falling back to gemini")
            self.provider_name = "gemini"

        service_class = self.PROVIDERS[self.provider_name]
        service = service_class()

        if not service.is_available():
            logger.warning(f"Provider '{self.provider_name}' API key not configured!")

        return service

    def text_completion(self, prompt: str, system_prompt: str = None) -> dict:
        """
        Send a text completion request to the configured provider.

        Args:
            prompt: The user prompt/query
            system_prompt: Optional system instructions

        Returns:
            dict with 'success' and 'text' keys on success, or 'error' key on failure
        """
        if not self.service.is_available():
            return {"error": f"Provider '{self.provider_name}' is not configured"}

        return self.service.text_completion(prompt, system_prompt)

    def vision_completion(self, prompt: str, image_base64: str, mime_type: str = "image/jpeg") -> dict:
        """
        Send a vision completion request to the configured provider.

        Args:
            prompt: The analysis prompt
            image_base64: Base64 encoded image data
            mime_type: MIME type of the image

        Returns:
            dict with 'success' and 'text' keys on success, or 'error' key on failure
        """
        if not self.service.is_available():
            return {"error": f"Provider '{self.provider_name}' is not configured"}

        return self.service.vision_completion(prompt, image_base64, mime_type)

    def get_provider_info(self) -> dict:
        """Get information about the current provider."""
        return {
            "provider": self.provider_name,
            "available": self.service.is_available(),
            "model": getattr(self.service, 'model', 'unknown'),
            "vision_model": getattr(self.service, 'vision_model', 'not supported')
        }

    def switch_provider(self, provider_name: str) -> bool:
        """
        Dynamically switch to a different provider.

        Args:
            provider_name: Name of the provider to switch to

        Returns:
            True if switch was successful
        """
        if provider_name.lower() not in self.PROVIDERS:
            logger.error(f"Cannot switch to unknown provider: {provider_name}")
            return False

        self.provider_name = provider_name.lower()
        self.service = self._init_service()
        return self.service.is_available()


# Singleton instance
_router_instance: Optional[LLMRouter] = None


def get_llm_router() -> LLMRouter:
    """Get the singleton LLM Router instance."""
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return _router_instance
