# LLMServer

A lightweight Python service that acts as a fallback replacement for the mlserver, using FREE LLM APIs instead of heavy ML models.

## Features

- **No Heavy Dependencies**: No TensorFlow, Torch, PaddleOCR, Spacy, or CUDA required
- **Multiple LLM Providers**: Support for Gemini, Mistral, Cerebras, and Groq
- **API Compatible**: Same REST API endpoints as the original mlserver
- **Cost Optimized**: Uses smallest capable models with token limits
- **Structured JSON Output**: Enforced JSON responses with validation and retry logic

## Supported Tasks

1. Image Classification
2. Violence Detection
3. Seat Damage Analysis
4. Window Damage Detection
5. OCR Text Extraction
6. Translation
7. Text Categorization
8. Text Sub-categorization
9. Complaint Severity Scoring
10. Sentiment Analysis

## Quick Start

### 1. Install Dependencies

```bash
cd llmserver
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API key for your chosen provider
```

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:9898` by default.

## Configuration

### LLM Provider Selection

Set the `LLM_PROVIDER` environment variable:

```bash
LLM_PROVIDER=gemini   # Google Gemini (recommended for vision tasks)
LLM_PROVIDER=mistral  # Mistral AI
LLM_PROVIDER=cerebras # Cerebras (text-only, no vision)
LLM_PROVIDER=groq     # Groq (fast inference)
```

### API Keys

Get your API keys from:
- **Gemini**: https://makersuite.google.com/app/apikey (FREE tier available)
- **Mistral**: https://console.mistral.ai/ (FREE tier available)
- **Cerebras**: https://cloud.cerebras.ai/ (FREE tier available)
- **Groq**: https://console.groq.com/ (FREE tier available)

## API Endpoints

All endpoints match the original mlserver structure:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/severity/seat_priority` | POST | Seat damage analysis |
| `/v1/severity/win_priority` | POST | Window damage analysis |
| `/v1/severity/comp_severity` | POST | Complaint image analysis |
| `/v1/violence/violence_severity` | POST | Violence detection |
| `/v1/ocr/ocr_extraction` | POST | OCR text extraction |
| `/v1/text/text_category` | POST | Text categorization and subcategory (uses Cerebras API) |
| `/v1/text/text_subcategory` | POST | Text sub-categorization |
| `/v1/translate` | POST | Text translation |
| `/v1/review_analysis/feedback_sentiment` | POST | Sentiment analysis |
| `/v1/predictimage` | POST | Image classification |
| `/v1/predictvideo` | POST | Video classification |
| `/v1/upload` | POST | Image upload |
| `/v1/get_image/<filename>` | GET | Retrieve uploaded image |
| `/health` | GET | Health check |
| `/provider` | GET | Current provider info |

## Project Structure

```
llmserver/
├── app.py                  # Main Flask application
├── routes/                 # API route handlers
│   ├── seat_routes.py
│   ├── window_routes.py
│   ├── violence_routes.py
│   ├── ocr_routes.py
│   ├── text_catg_routes.py
│   ├── translate_routes.py
│   ├── feedback_routes.py
│   ├── comp_routes.py
│   └── img_category_routes.py
├── services/               # LLM provider services
│   ├── llm_router.py       # Provider routing
│   ├── gemini_service.py
│   ├── mistral_service.py
│   ├── cerebras_service.py
│   └── groq_service.py
├── utils/                  # Utility modules
│   ├── prompt_builder.py   # Structured prompt templates
│   ├── response_validator.py # JSON validation & retry
│   └── file_helpers.py     # File/image utilities
├── uploads/                # Temporary upload storage
├── requirements.txt
├── .env.example
└── README.md
```

## Comparison with mlserver

| Feature | mlserver | llmserver |
|---------|----------|-----------|
| Dependencies | TensorFlow, Torch, PaddleOCR, Spacy, CUDA | Flask, Requests, Pillow |
| Install Size | ~5-10 GB | ~50 MB |
| GPU Required | Yes (for optimal performance) | No |
| Vision Tasks | Custom trained models | LLM Vision APIs |
| Text Tasks | Spacy, custom models | LLM Text APIs |
| Cost | Infrastructure/GPU costs | API usage costs (FREE tiers available) |
| Accuracy | Production trained models | LLM general knowledge |

## Limitations

1. **Video Processing**: Limited without heavy libraries. Only basic classification based on filename.
2. **Forecasting**: ARIMA forecasting not available (requires statsmodels).
3. **Image Annotation**: Cannot draw bounding boxes without OpenCV.
4. **Cerebras**: Does not support vision tasks, falls back to text-only analysis.

## Error Handling

- All LLM responses are validated for proper JSON format
- Automatic retry (once) on parse failures
- Fallback responses if LLM fails
- Structured error responses matching original API

## License

Same as the parent Rail Sahayta project.
