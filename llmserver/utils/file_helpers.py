"""
File Helpers - Utilities for file handling, image processing, etc.
"""

import os
import base64
import io
import logging
from typing import Tuple, Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Upload folder configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
CLOUD_STORAGE_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cloud-storage')


def ensure_upload_folders():
    """Ensure upload directories exist."""
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(CLOUD_STORAGE_FOLDER, exist_ok=True)


def image_to_base64(image_data: bytes, resize_max: int = 1024) -> Tuple[str, str]:
    """
    Convert image bytes to base64 string, optionally resizing.

    Args:
        image_data: Raw image bytes
        resize_max: Maximum dimension (width or height) to resize to

    Returns:
        Tuple of (base64_string, mime_type)
    """
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(image_data))

        # Get original format
        img_format = image.format or 'JPEG'
        mime_type = f"image/{img_format.lower()}"

        # Convert to RGB if necessary (for JPEG compatibility)
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
            img_format = 'JPEG'
            mime_type = 'image/jpeg'

        # Resize if too large (to reduce API costs and improve speed)
        if resize_max and (image.width > resize_max or image.height > resize_max):
            ratio = min(resize_max / image.width, resize_max / image.height)
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            logger.debug(f"Resized image from {image.width}x{image.height} to {new_size}")

        # Convert to bytes
        buffer = io.BytesIO()
        image.save(buffer, format=img_format, quality=85)
        buffer.seek(0)

        # Encode to base64
        base64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return base64_str, mime_type

    except Exception as e:
        logger.error(f"Error processing image: {e}")
        # Return original as fallback
        return base64.b64encode(image_data).decode('utf-8'), 'image/jpeg'


def base64_to_image_bytes(base64_str: str) -> bytes:
    """Convert base64 string back to image bytes."""
    return base64.b64decode(base64_str)


def create_placeholder_image(width: int = 200, height: int = 200, text: str = "Processed") -> str:
    """
    Create a simple placeholder image and return as base64.
    Used when actual image processing is not available.
    """
    try:
        # Create a simple gray image with text
        image = Image.new('RGB', (width, height), color=(200, 200, 200))

        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)

        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    except Exception as e:
        logger.error(f"Error creating placeholder image: {e}")
        return ""


def save_uploaded_file(file_storage, folder: str = None) -> Optional[str]:
    """
    Save an uploaded file to the specified folder.

    Args:
        file_storage: Flask FileStorage object
        folder: Target folder (defaults to UPLOAD_FOLDER)

    Returns:
        Path to saved file or None on error
    """
    try:
        if folder is None:
            folder = UPLOAD_FOLDER

        ensure_upload_folders()

        filename = file_storage.filename
        filepath = os.path.join(folder, filename)

        file_storage.save(filepath)
        logger.debug(f"Saved file to: {filepath}")

        return filepath

    except Exception as e:
        logger.error(f"Error saving file: {e}")
        return None


def get_file_extension(filename: str) -> str:
    """Get lowercase file extension."""
    return os.path.splitext(filename)[1].lower()


def is_image_file(filename: str) -> bool:
    """Check if filename has an image extension."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'}
    return get_file_extension(filename) in image_extensions


def is_video_file(filename: str) -> bool:
    """Check if filename has a video extension."""
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'}
    return get_file_extension(filename) in video_extensions


def get_mime_type(filename: str) -> str:
    """Get MIME type from filename."""
    extension = get_file_extension(filename)
    mime_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.tiff': 'image/tiff',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm'
    }
    return mime_map.get(extension, 'application/octet-stream')


def cleanup_temp_files(filepath: str):
    """Remove temporary files."""
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
            logger.debug(f"Cleaned up: {filepath}")
    except Exception as e:
        logger.warning(f"Could not cleanup {filepath}: {e}")


# Initialize folders on import
ensure_upload_folders()
