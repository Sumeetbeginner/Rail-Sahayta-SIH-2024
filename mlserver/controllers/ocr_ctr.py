"""
OCR Controller - Text extraction from images using Tesseract OCR
Refactored to remove PaddleOCR dependency
"""

from PIL import Image
import io
import re
import numpy as np
import cv2
import pytesseract

# Regular expressions for Train No, PNR No, and any 8-digit number
train_no_regex = r'\b\d{4,5}\b'  # Matches any 4-5 digit number
pnr_no_regex = r'\b\d{3}-\d{7}\b'  # Matches PNR format like XXX-XXXXXXX
pnr_no_regex2 = r'\b\d{10}\b'  # Matches 10-digit PNR
eight_digit_number_regex = r'\b\d{8}\b'  # Matches any 8-digit number

print("OCR Controller initialized with Tesseract OCR")


def preprocess_image_from_memory(file):
    """
    Preprocess the image for optimal OCR results.
    
    Args:
        file: Image file bytes
        
    Returns:
        PIL Image object ready for OCR
    """
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(file))
        
        # Resize if too large (keeping readable size)
        max_dim = 2000
        if max(image.width, image.height) > max_dim:
            ratio = max_dim / max(image.width, image.height)
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB
        image = image.convert('RGB')
        
        return image
        
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {e}")


def perform_ocr_from_image(image):
    """
    Perform OCR on the given PIL image using Tesseract with preprocessing.
    
    Args:
        image: PIL Image object
        
    Returns:
        Extracted text string
    """
    try:
        # Convert PIL image to numpy array
        img_array = np.array(image)
        
        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Apply adaptive thresholding for better text detection
        # This helps with varying lighting conditions
        try:
            binary = cv2.adaptiveThreshold(
                gray, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 
                11, 2
            )
        except:
            # Fallback to simple thresholding if adaptive fails
            _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        
        # Optional: Denoise
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
        
        # Perform OCR with optimized config
        # --oem 3: Use default OCR Engine Mode
        # --psm 6: Assume a single uniform block of text
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(denoised, config=custom_config)
        
        # Clean and return text
        cleaned_text = text.strip()
        
        if not cleaned_text:
            # Try again with original grayscale if preprocessing didn't work
            text = pytesseract.image_to_string(gray, config=custom_config)
            cleaned_text = text.strip()
        
        return cleaned_text if cleaned_text else "No text detected"
        
    except Exception as e:
        print(f"OCR extraction failed: {e}")
        return f"OCR extraction failed: {str(e)}"


def extract_info(text):
    """
    Extract required information like Train Number, PNR Number, and Ticket Number using regex.
    """
    train_numbers = re.findall(train_no_regex, text)
    pnr_numbers = re.findall(pnr_no_regex, text)
    if not pnr_numbers:
        pnr_numbers = re.findall(pnr_no_regex2, text)
    eight_digit_numbers = re.findall(eight_digit_number_regex, text)

    return {
        "Train Number": train_numbers[0] if train_numbers else "Not Found",
        "PNR Numbers": pnr_numbers[0] if pnr_numbers else "Not Found",
        "Ticket Number": eight_digit_numbers[0] if eight_digit_numbers else "Not Found"
    }
