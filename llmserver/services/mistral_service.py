"""
Mistral LLM Service - Mistral API Integration
"""

import os
import json
import requests
import base64
import logging

logger = logging.getLogger(__name__)

MISTRAL_API_URL = "https://api.mistral.ai/v1"


class MistralService:
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        self.model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
        self.vision_model = os.getenv("MISTRAL_VISION_MODEL", "pixtral-12b-2409")
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
        Send a text completion request to Mistral API.
        """
        try:
            url = f"{MISTRAL_API_URL}/chat/completions"

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
                logger.error(f"Mistral API error: {response.status_code} - {response.text}")
                return {"error": f"API error: {response.status_code}", "raw": response.text}

            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                text = result["choices"][0]["message"]["content"]
                return {"success": True, "text": text}
            else:
                return {"error": "No choices in response", "raw": result}

        except requests.exceptions.Timeout:
            logger.error("Mistral API timeout")
            return {"error": "Request timeout"}
        except Exception as e:
            logger.error(f"Mistral API exception: {str(e)}")
            return {"error": str(e)}

    def vision_completion(self, prompt: str, image_base64: str, mime_type: str = "image/jpeg") -> dict:
        """
        Send a vision completion request to Mistral API with an image.
        Uses Pixtral model for vision tasks.
        """
        try:
            url = f"{MISTRAL_API_URL}/chat/completions"

            # Build image URL for Mistral vision
            data_url = f"data:{mime_type};base64,{image_base64}"

            messages = [{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": data_url
                        }
                    }
                ]
            }]

            payload = {
                "model": self.vision_model,
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
                logger.error(f"Mistral Vision API error: {response.status_code} - {response.text}")
                return {"error": f"API error: {response.status_code}", "raw": response.text}

            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                text = result["choices"][0]["message"]["content"]
                return {"success": True, "text": text}
            else:
                return {"error": "No choices in response", "raw": result}

        except requests.exceptions.Timeout:
            logger.error("Mistral Vision API timeout")
            return {"error": "Request timeout"}
        except Exception as e:
            logger.error(f"Mistral Vision API exception: {str(e)}")
            return {"error": str(e)}

    def is_available(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)
