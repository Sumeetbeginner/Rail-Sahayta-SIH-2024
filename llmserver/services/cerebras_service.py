"""
Cerebras LLM Service - Cerebras API Integration
"""

import os
import json
import requests
import logging

logger = logging.getLogger(__name__)

CEREBRAS_API_URL = "https://api.cerebras.ai/v1"


class CerebrasService:
    def __init__(self):
        self.api_key = os.getenv("CEREBRAS_API_KEY")
        self.model = os.getenv("CEREBRAS_MODEL", "llama3.1-8b")
        self.max_tokens = int(os.getenv("MAX_TOKENS", "1024"))
        self.temperature = float(os.getenv("TEMPERATURE", "0.3"))
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def text_completion(self, prompt: str, system_prompt: str = None) -> dict:
        """
        Send a text completion request to Cerebras API.
        """
        try:
            url = f"{CEREBRAS_API_URL}/chat/completions"

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }

            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=self.timeout
            )

            if response.status_code != 200:
                logger.error(f"Cerebras API error: {response.status_code} - {response.text}")
                return {"error": f"API error: {response.status_code}", "raw": response.text}

            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                text = result["choices"][0]["message"]["content"]
                return {"success": True, "text": text}
            else:
                return {"error": "No choices in response", "raw": result}

        except requests.exceptions.Timeout:
            logger.error("Cerebras API timeout")
            return {"error": "Request timeout"}
        except Exception as e:
            logger.error(f"Cerebras API exception: {str(e)}")
            return {"error": str(e)}

    def vision_completion(self, prompt: str, image_base64: str, mime_type: str = "image/jpeg") -> dict:
        """
        Cerebras does not support vision models natively.
        This will fallback to text-only analysis with a note about the limitation.
        """
        logger.warning("Cerebras does not support vision models. Using text-only fallback.")
        
        # Create a modified prompt acknowledging the limitation
        modified_prompt = f"""Note: Image analysis is limited for this provider.
Based on the following task, provide a reasonable default response:

{prompt}

Since I cannot see the actual image, provide a conservative/neutral response."""
        
        return self.text_completion(modified_prompt)

    def is_available(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)
