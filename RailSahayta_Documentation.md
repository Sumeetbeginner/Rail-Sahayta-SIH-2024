# Rail Sahayta: Indian Railway Complaint Management System Documentation

## Overview
Rail Sahayta is a comprehensive AI-powered complaint management system designed for Indian Railways. It leverages machine learning and computer vision techniques to automate complaint categorization, severity assessment, and predictive analytics. The system includes user-facing applications, staff dashboards, and administrative tools to streamline railway complaint resolution.

## System Architecture

### Backend Components
- **Main Server**: Node.js/Express server (Port 3001) with MongoDB for data persistence
- **ML Server**: Python/Flask server (Port 9898) hosting various ML models
- **YOLO Server**: Python/Flask server for object detection
- **Subcategory Server**: Python/Flask server for image subcategory classification
- **Chatbot Server**: Python-based AI chatbot
- **WebRTC Server**: Video communication server

### Frontend Components
- **User Client**: React/Vite application for passengers
- **Staff/Admin Dashboard**: React application for railway staff
- **WebRTC Client**: Video calling interface

## Core Features

### 1. Complaint Submission and Management
- **Multi-category Complaint System**: Supports 10 main categories with subcategories
  - Seat (broken, scratched, dirty, bedroll)
  - Window (cracked, dirty, broken)
  - Food (spoilt, taste, quantity)
  - Compartment (garbage)
  - Toilet (unhygienic toilet/washbasin, flush problem, no water)
  - Violence (staff/passenger behavior, bribery, seat hijacking, smoking/alcohol)
  - Management (train delay, app issues, missing items)
  - Ticketing Issues (wrong ticket, money issues)
  - Security (robbery, misbehaviour, unauthorized persons, absence of security)
  - Electricity (AC, Light, Fan, Charging Port)
  - Medical (First Aid Kit, Medical Assistance)

- **Cross-Department Complaints**: Allows complaints involving multiple departments
- **Media Upload**: Support for image uploads with automatic processing
- **Status Tracking**: Pending → In Process → Completed workflow
- **Feedback System**: Post-resolution feedback with rating and sentiment analysis
- **Complaint Reraise**: Users can escalate unresolved complaints

### 2. User Roles and Access Control
- **Passengers**: Submit complaints, view status, provide feedback
- **Staff**: Update complaint status, manage assigned complaints
- **Administrators**: System management, user management, analytics

### 3. Analytics and Reporting
- **Predictive Forecasting**: Time-series analysis for complaint trends
- **Department-wise Analytics**: Complaint distribution across railway departments
- **Severity Analysis**: Automated severity scoring for complaints

## Machine Learning and AI Techniques

### 1. Text Processing and Categorization
**Technique**: TF-IDF Vectorization + Machine Learning Classifier
**Model**: Pickled scikit-learn model (SVM/Logistic Regression)
**Purpose**: Automatically categorize complaint text into predefined categories
**Input**: Complaint description text
**Output**: Predicted category (e.g., "seat", "food", "violence")

### 2. Image Classification
**Technique**: Convolutional Neural Networks (CNN)
**Model**: VGG16-based TensorFlow SavedModel
**Purpose**: Classify uploaded images into railway-related categories
**Input**: RGB images (224x224)
**Output**: Category prediction from 15 classes:
- bags, bedroll, charging_port, seat, window, door, fan, food, medical, packaged_food, unhyg_comp, unhyg_toilet, unhyg_washroom, violence, win_img

### 3. Optical Character Recognition (OCR)
**Technique**: PaddleOCR (PaddlePaddle framework)
**Purpose**: Extract text information from uploaded images
**Input**: Images containing tickets, PNR cards, etc.
**Output**: Extracted text with regex-based parsing for:
- Train Numbers (4-5 digits)
- PNR Numbers (XXX-XXXXXXX format)
- 8-digit numbers

### 4. Image Segmentation and Severity Analysis
**Technique**: U-Net Convolutional Networks
**Models**: TensorFlow SavedModel for seat, window, and violence detection
**Purpose**: Segment damaged/violent areas and calculate severity percentage
**Input**: RGB images (128x128 or 256x256)
**Output**: 
- Binary segmentation mask
- Severity percentage (0-100%)
- Overlay visualization

### 5. Sentiment Analysis
**Technique**: TF-IDF Vectorization + Machine Learning Classifier
**Model**: Pickled scikit-learn sentiment model
**Purpose**: Analyze feedback sentiment and extract key information
**Features**:
- Sentiment scoring (positive probability)
- Named Entity Recognition (spaCy) for time/action entities
- Central idea extraction using TF-IDF keywords

### 6. Time Series Forecasting
**Technique**: ARIMA (AutoRegressive Integrated Moving Average)
**Purpose**: Predict future complaint volumes by category/department
**Input**: Historical complaint data (monthly aggregation)
**Output**: 3-month forecast for complaint trends

### 7. Object Detection
**Technique**: YOLOv5 (You Only Look Once v5)
**Model**: PyTorch-based custom trained model
**Purpose**: Detect and localize objects in images
**Input**: Images
**Output**: Bounding boxes with class predictions and confidence scores

### 8. Subcategory Classification
**Technique**: CNN-based Image Classification
**Model**: TensorFlow SavedModel
**Purpose**: Fine-grained classification for specific complaint types
**Categories**:
- Basin classification: basin, dirty_basin
- Crowd classification: crowded, less_crowded

### 9. AI Chatbot
**Technique**: Large Language Model + Retrieval-Augmented Generation
**Model**: Gemma 2B via Ollama
**Features**:
- Context-aware responses based on railway knowledge base
- Topic matching using TF-IDF cosine similarity
- Railway-specific query answering

### 10. Translation Services
**Purpose**: Multilingual support for diverse Indian language speakers
**Implementation**: Integrated translation API for complaint processing

## Automation Features

### Intelligent Complaint Processing
1. **Auto-Categorization**: ML automatically suggests categories based on text and images
2. **Severity Scoring**: Computer vision assesses damage severity automatically
3. **Priority Assignment**: Based on category, severity, and cross-department involvement
4. **Smart Routing**: Automatic assignment to appropriate departments and staff

### Predictive Analytics
1. **Trend Forecasting**: Predict complaint spikes for resource planning
2. **Department Load Balancing**: Anticipate workload distribution
3. **Preventive Maintenance**: Identify patterns for proactive fixes

### Quality Assurance
1. **Sentiment Monitoring**: Track customer satisfaction trends
2. **Resolution Time Analysis**: ML-driven insights for process optimization
3. **Feedback Analysis**: Extract actionable insights from user feedback

## Technical Stack

### Backend
- **Runtime**: Node.js, Python
- **Frameworks**: Express.js, Flask
- **Database**: MongoDB
- **Authentication**: JWT
- **File Storage**: Local filesystem with static serving

### Machine Learning
- **Frameworks**: TensorFlow, PyTorch, scikit-learn, spaCy
- **Computer Vision**: OpenCV, Pillow
- **OCR**: PaddleOCR
- **Time Series**: statsmodels

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Charts**: Chart.js
- **HTTP Client**: Axios
- **Styling**: CSS Modules

### Infrastructure
- **Version Control**: Git
- **Containerization**: Docker (implied from model serving)
- **Real-time Communication**: WebRTC
- **Email**: Nodemailer

## Data Flow

1. **Complaint Submission**:
   - User uploads image/text → ML Server processes for categorization/OCR
   - Auto-filled fields based on ML predictions
   - Stored in MongoDB with metadata

2. **Processing**:
   - Staff views complaints → Updates status
   - Cross-dept coordination for complex issues

3. **Resolution**:
   - Feedback collected → Sentiment analysis
   - Analytics updated for forecasting

4. **Analytics**:
   - ML models retrained periodically with new data
   - Forecasting models updated with latest trends

## Railway Department Integration

The system maps complaints to specific railway departments:
- **Mechanical**: Seat, Window issues
- **Catering**: Food complaints
- **Hygiene**: Toilet, Compartment cleanliness
- **Security**: Violence, Security incidents
- **Management**: Delays, General issues
- **Commercial**: Ticketing problems
- **Electrical**: Power, AC, Lighting issues
- **Medical**: Health-related complaints

## Future Enhancements

- Real-time video analysis for live complaint verification
- Integration with railway reservation systems
- Mobile app development
- Multi-language NLP support
- Advanced anomaly detection
- Predictive maintenance scheduling

## Conclusion

Rail Sahayta represents a comprehensive application of AI and ML in public service management, specifically tailored for Indian Railways. By automating complaint processing, severity assessment, and predictive analytics, the system significantly improves efficiency, response times, and customer satisfaction in railway operations.</content>
<filePath="I:\Rail Sahayta\RailSahayta_Documentation.md