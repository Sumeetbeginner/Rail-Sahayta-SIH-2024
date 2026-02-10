"""
Prompt Builder - Constructs structured prompts for various ML tasks
"""

from typing import List, Dict, Optional


class PromptBuilder:
    """
    Builds structured prompts for LLM tasks.
    All prompts enforce JSON-only responses.
    """

    # Base JSON instruction
    JSON_INSTRUCTION = """
Return ONLY valid JSON. Do not include explanations, markdown, or code blocks.
Output must be parseable as JSON directly."""

    @staticmethod
    def image_classification(categories: List[str] = None) -> str:
        """Build prompt for image classification."""
        if categories is None:
            categories = [
                "damage_seat", "damage_window", "food", "unhygenic_compartment",
                "unhygenic_toilet", "violence", "management", "ticketing_issue",
                "security", "electricity", "medical", "other"
            ]

        return f"""{PromptBuilder.JSON_INSTRUCTION}

Analyze this image and classify it into ONE of these railway complaint categories:
{', '.join(categories)}

Consider:
- Physical damage to seats, windows, or infrastructure
- Hygiene issues in compartments or toilets
- Safety or security concerns
- Food quality issues
- General management or service issues

Return JSON format:
{{"predicted_class": "<category>", "confidence": <0.0-1.0>}}"""

    @staticmethod
    def violence_detection() -> str:
        """Build prompt for violence detection and severity scoring."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Analyze this image for signs of violence, physical altercation, or threatening behavior.

Severity scale:
- 0: No violence detected (peaceful scene)
- 1: Minor concern (tense situation, verbal conflict)
- 2: Moderate violence (pushing, shoving, minor physical contact)
- 3: Severe violence (fighting, assault, weapons visible)
- 4: Critical violence (multiple people fighting, dangerous situation)

Return JSON format:
{{"severity": <0-4>, "description": "<brief description of what is observed>"}}"""

    @staticmethod
    def seat_damage_analysis() -> str:
        """Build prompt for seat damage severity analysis."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Analyze this image of a railway seat for damage.

Severity scale:
- 0: No damage (seat in good condition)
- 1: Minor wear (light scratches, minor stains)
- 2: Moderate damage (torn fabric, noticeable stains, minor structural issues)
- 3: Significant damage (large tears, broken parts, heavy soiling)
- 4: Severe damage (seat unusable, major structural damage)

Return JSON format:
{{"severity": <0-4>, "description": "<brief description of damage observed>"}}"""

    @staticmethod
    def window_damage_analysis() -> str:
        """Build prompt for window damage severity analysis."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Analyze this railway window image for damage or defects.

Severity scale:
- 0: No damage (clear, intact window)
- 1: Minor issues (light scratches, minor smudges)
- 2: Moderate damage (visible cracks, chips, heavy scratches)
- 3: Significant damage (large cracks, broken sections)
- 4: Severe damage (shattered, missing glass, safety hazard)

Return JSON format:
{{"status": <0-4>, "description": "<brief description of window condition>"}}"""

    @staticmethod
    def ocr_extraction() -> str:
        """Build prompt for OCR text extraction from images."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Extract all visible text from this image. Focus on:
- Train numbers, PNR numbers
- Station names
- Date and time information
- Ticket details
- Signs and notices
- Any printed or handwritten text

Return JSON format:
{{
    "Detected Text": "<all text found in image, separated by newlines>",
    "Extracted Information": {{
        "train_number": "<if found>",
        "pnr": "<if found>",
        "station": "<if found>",
        "date": "<if found>",
        "other_details": ["<any other important info>"]
    }}
}}"""

    @staticmethod
    def text_categorization_and_subcategory(complaint: str) -> str:
        """Build prompt for complaint text categorization and subcategory selection."""
        # Categories and subcategories based on hierarchy2.json
        hierarchy = {
            "seat": ["broken seat", "scratched seat", "dirty seat", "bedroll"],
            "window": ["cracked window", "dirty window", "broken window"],
            "food": ["spoilt/expired food", "food taste", "food quantity"],
            "compartment": ["garbage on coach"],
            "toilet": ["unhygenic toilet", "unhygenic washbasin", "flush problem", "no water"],
            "violence": ["staff violence/behaviour", "passenger violence", "bribery", "seat hijacking", "smoking/alcohol"],
            "management": ["train delay", "app issue", "missing items"],
            "ticketing issue": ["wrong ticket", "money issue"],
            "security": ["robbery", "misbehaviour with lady passenger", "unauthorized person in ladies coach", "absence of security personnel"],
            "electricity": ["AC (Air Conditioner)", "Light", "Fan", "Charging Port"],
            "medical": ["First Aid Kit Requirement", "Medical Assistance"]
        }

        # Build the prompt with categories and their subcategories
        category_list = []
        for category, subcats in hierarchy.items():
            category_list.append(f"{category}: {', '.join(subcats)}")

        return f"""{PromptBuilder.JSON_INSTRUCTION}

Analyze this railway complaint and categorize it into the most appropriate category and subcategory.

Available categories and their subcategories:
{chr(10).join(f"- {cat}" for cat in category_list)}

Complaint: "{complaint}"

Consider the keywords, context, and meaning to determine the most appropriate category and subcategory.

Return JSON format:
{{"category": "<category>", "subcategory": "<subcategory>"}}"""

    @staticmethod
    def text_subcategorization(description: str, category: str) -> str:
        """Build prompt for complaint sub-categorization."""
        subcategory_map = {
            "damage_seat": ["torn_fabric", "broken_armrest", "stained", "missing_cushion", "structural_damage"],
            "damage_window": ["cracked", "shattered", "scratched", "jammed", "missing_latch"],
            "food": ["cold_food", "spoiled", "unhygienic", "wrong_order", "overpriced", "quantity"],
            "unhygenic_compartment": ["dirty_floor", "foul_smell", "garbage", "pest_infestation", "broken_fan"],
            "unhygenic_toilet": ["no_water", "dirty", "clogged", "broken_door", "foul_smell"],
            "violence": ["verbal_abuse", "physical_assault", "harassment", "theft", "threat"],
            "management": ["staff_behavior", "delay", "miscommunication", "refund_issue", "lost_luggage"],
            "ticketing issue": ["wrong_ticket", "no_refund", "overcharge", "booking_error", "cancellation"],
            "security": ["suspicious_person", "unattended_luggage", "emergency", "fire", "robbery"],
            "Electricity": ["no_power", "fan_not_working", "ac_issue", "charging_point", "light_issue"],
            "medical": ["injury", "illness", "first_aid", "ambulance_needed", "medicine_required"]
        }

        subcategories = subcategory_map.get(category, ["general", "other"])

        return f"""{PromptBuilder.JSON_INSTRUCTION}

Given this complaint in the "{category}" category, determine the most appropriate subcategory.

Available subcategories for {category}:
{', '.join(subcategories)}

Complaint description: "{description}"

Return JSON format:
{{"subcategory": "<subcategory>"}}"""

    @staticmethod
    def sentiment_analysis(feedback: str) -> str:
        """Build prompt for feedback sentiment analysis."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Analyze the sentiment and extract key information from this feedback.

Feedback: "{feedback}"

Analyze for:
1. Overall sentiment (-1.0 to 1.0 scale)
2. Key time references mentioned
3. Actions or events described
4. Central idea/theme
5. Area needing improvement

Return JSON format:
{{
    "processed_feedback": "<cleaned/normalized feedback>",
    "time_and_actions": {{
        "time_references": ["<any times mentioned>"],
        "actions": ["<main actions/events>"]
    }},
    "central_idea": "<main theme or issue>",
    "sentiment_score": <-1.0 to 1.0>,
    "improvement_area": "<what needs improvement>"
}}"""

    @staticmethod
    def translation(text: str, target_lang: str = "en") -> str:
        """Build prompt for text translation."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Translate the following text to English. Detect the source language automatically.

Text: "{text}"

Return JSON format:
{{
    "original_text": "<original text>",
    "translated_text": "<english translation>",
    "source_language": "<detected source language code>"
}}"""

    @staticmethod
    def complaint_severity(predictions: List[Dict]) -> str:
        """Build prompt for overall complaint severity assessment."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Based on these detected issues in a railway complaint image, assess overall severity.

Detected items: {predictions}

Severity levels:
- low: Minor aesthetic issues
- medium: Functional problems affecting comfort
- high: Safety concerns or major damage
- critical: Immediate safety hazard

Return JSON format:
{{
    "overall_severity": "<low/medium/high/critical>",
    "priority_score": <1-10>,
    "summary": "<brief assessment>"
}}"""

    @staticmethod
    def video_analysis_summary(frame_analyses: List[Dict]) -> str:
        """Build prompt to summarize multiple video frame analyses."""
        return f"""{PromptBuilder.JSON_INSTRUCTION}

Summarize these analyses from multiple video frames to determine the overall classification.

Frame analyses: {frame_analyses}

Return JSON format:
{{
    "predicted_class": "<most frequent/relevant category>",
    "confidence": <0.0-1.0 based on consistency>,
    "summary": "<brief description of video content>"
}}"""


# Singleton instance for easy import
prompt_builder = PromptBuilder()
