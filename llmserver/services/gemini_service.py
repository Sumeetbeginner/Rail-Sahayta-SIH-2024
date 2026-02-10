"""
Gemini LLM Service - Google AI Studio API Integration
"""

import os
import json
import requests
import base64
import logging

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.vision_model = os.getenv("GEMINI_VISION_MODEL", "gemini-1.5-flash")
        self.max_tokens = int(os.getenv("MAX_TOKENS", "1024"))
        self.temperature = float(os.getenv("TEMPERATURE", "0.3"))
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))

    def _get_headers(self):
        return {"Content-Type": "application/json"}

    def _build_url(self, model: str) -> str:
        return f"{GEMINI_API_URL}/{model}:generateContent?key={self.api_key}"

    def text_completion(self, prompt: str, system_prompt: str = None) -> dict:
        """
        Send a text completion request to Gemini API.
        """
        try:
            url = self._build_url(self.model)

            contents = []
            if system_prompt:
                contents.append({
                    "role": "user",
                    "parts": [{"text": f"System: {system_prompt}\n\nUser: {prompt}"}]
                })
            else:
                contents.append({
                    "role": "user",
                    "parts": [{"text": prompt}]
                })

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": self.temperature,
                    "maxOutputTokens": self.max_tokens,
                    "topP": 0.95,
                    "topK": 40
                }
            }

            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=self.timeout
            )

            if response.status_code != 200:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return {"error": f"API error: {response.status_code}", "raw": response.text}

            result = response.json()
            
            if "candidates" in result and len(result["candidates"]) > 0:
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "text": text}
            else:
                return {"error": "No candidates in response", "raw": result}

        except requests.exceptions.Timeout:
            logger.error("Gemini API timeout")
            return {"error": "Request timeout"}
        except Exception as e:
            logger.error(f"Gemini API exception: {str(e)}")
            return {"error": str(e)}

    def vision_completion(self, prompt: str, image_base64: str, mime_type: str = "image/jpeg") -> dict:
        """
        Send a vision completion request to Gemini API with an image.
        """
        try:
            url = self._build_url(self.vision_model)

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": self.temperature,
                    "maxOutputTokens": self.max_tokens,
                    "topP": 0.95,
                    "topK": 40
                }
            }

            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=self.timeout
            )

            if response.status_code != 200:
                logger.error(f"Gemini Vision API error: {response.status_code} - {response.text}")
                return {"error": f"API error: {response.status_code}", "raw": response.text}

            result = response.json()

            if "candidates" in result and len(result["candidates"]) > 0:
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "text": text}
            else:
                return {"error": "No candidates in response", "raw": result}

        except requests.exceptions.Timeout:
            logger.error("Gemini Vision API timeout")
            return {"error": "Request timeout"}
        except Exception as e:
            logger.error(f"Gemini Vision API exception: {str(e)}")
            return {"error": str(e)}

    def is_available(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)
