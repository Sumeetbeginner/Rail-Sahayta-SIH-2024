"""
Routes Package for llmserver
"""

from .seat_routes import api_routes_seat
from .window_routes import api_routes_win
from .violence_routes import api_routes_violence
from .ocr_routes import api_routes_ocr
from .text_catg_routes import api_routes_text_catg
from .translate_routes import api_route_translate
from .feedback_routes import api_routes_feedback
from .comp_routes import api_routes_comp
from .img_category_routes import api_routes_img_category

__all__ = [
    'api_routes_seat',
    'api_routes_win',
    'api_routes_violence',
    'api_routes_ocr',
    'api_routes_text_catg',
    'api_route_translate',
    'api_routes_feedback',
    'api_routes_comp',
    'api_routes_img_category'
]
