from PIL import Image
import io
import re
import numpy as np

# Regular expressions for Train No, PNR No, and any 8-digit number
train_no_regex = r'\b\d{4,5}\b'  # Matches any 4-5 digit number
pnr_no_regex = r'\b\d{3}-\d{7}\b'  # Matches PNR format like XXX-XXXXXXX
pnr_no_regex2 = r'\b\d{10}\b'  # Matches 10-digit PNR
eight_digit_number_regex = r'\b\d{8}\b'  # Matches any 8-digit number

# Try importing PaddleOCR, fallback to Tesseract or basic approach
try:
    from paddleocr import PaddleOCR
    _ocr_engine = PaddleOCR(use_gpu=False, lang='en', show_log=False)
    OCR_AVAILABLE = True
    print("PaddleOCR loaded successfully")
except Exception as e:
    print(f"PaddleOCR not available: {e}")
    OCR_AVAILABLE = False
    try:
        import pytesseract
        TESSERACT_AVAILABLE = True
        print("Falling back to Tesseract OCR")
    except:
        TESSERACT_AVAILABLE = False
        print("No OCR engine available - will use basic approach")

def preprocess_image_from_memory(file):
    """
    Downscale the image and convert it to RGB format from an in-memory file.
    """
    try:
        image = Image.open(io.BytesIO(file))
        # Don't reduce too aggressively - keep readable
        max_dim = 2000
        if max(image.width, image.height) > max_dim:
            ratio = max_dim / max(image.width, image.height)
            image = image.resize((int(image.width * ratio), int(image.height * ratio)))
        image = image.convert('RGB')
        return image
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {e}")

def perform_ocr_from_image(image):
    """
    Perform OCR on the given PIL image using available OCR engine.
    """
    if OCR_AVAILABLE:
        try:
            # Convert PIL image to numpy array for PaddleOCR
            img_array = np.array(image)
            results = _ocr_engine.ocr(img_array, cls=True)
            
            if results and results[0]:
                all_text = [line[1][0] for line in results[0] if line[1]]
                return " ".join(all_text)
            return ""
        except Exception as e:
            print(f"PaddleOCR failed: {e}")
            # Fall through to other methods

    # Fallback: try Tesseract
    if not OCR_AVAILABLE:
        try:
            if TESSERACT_AVAILABLE:
                text = pytesseract.image_to_string(image)
                return text.strip()
        except Exception as e:
            print(f"Tesseract also failed: {e}")

    return "OCR extraction failed - please enter details manually"


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
