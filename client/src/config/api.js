/**
 * API Configuration - Central configuration for all API endpoints
 * Uses environment variables with fallbacks for development
 */

// Production URLs - automatically uses production if available, falls back to localhost
const API_URL = window.location.hostname === 'railsahayta.neuramaps.in' 
  ? 'https://rail-sahayta-final-1.onrender.com'
  : import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ML_SERVER_URL = window.location.hostname === 'railsahayta.neuramaps.in'
  ? 'https://rail-sahayta-final-2.onrender.com'
  : import.meta.env.VITE_ML_SERVER_URL || 'http://localhost:9898';

const LLM_SERVER_URL = window.location.hostname === 'railsahayta.neuramaps.in'
  ? 'https://rail-sahayta-final-2.onrender.com'
  : import.meta.env.VITE_LLM_SERVER_URL || 'http://localhost:9898';

// API Endpoints Configuration
export const API_CONFIG = {
  // Node.js Backend API
  API_BASE: API_URL,
  
  // ML Server API (mlserver or llmserver)
  ML_BASE: ML_SERVER_URL,
  ML_API: `${ML_SERVER_URL}/v1`,
  
  // Alternative LLM Server (if separate from ML server)
  LLM_BASE: LLM_SERVER_URL,
  LLM_API: `${LLM_SERVER_URL}/v1`,
  
  // Auth Endpoints
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    FETCH_USER: `${API_URL}/auth/fetchuserdata`,
  },
  
  // User Endpoints
  USER: {
    ADD_COMPLAINT: `${API_URL}/user/addcomplaint`,
    VIEW_COMPLAINTS: `${API_URL}/user/viewusercomp`,
    RERAISE_COMPLAINT: `${API_URL}/user/reraisecomp`,
    SUBMIT_FEEDBACK: `${API_URL}/user/submitfeedback`,
  },
  
  // Staff Endpoints
  STAFF: {
    LOGIN: `${API_URL}/staff/loginstaff`,
    ASSIGNED_COMPLAINTS: `${API_URL}/staff/assignedcomp`,
    SOLVED_COMPLAINTS: `${API_URL}/staff/solvedcomp`,
    UPDATE_STATUS: `${API_URL}/staff/updatecompstatus`,
    GET_COOKIES: `${API_URL}/staff/getcookiesdept`,
    REMOVE_COOKIE: `${API_URL}/staff/removecookie`,
  },
  
  // Admin Endpoints
  ADMIN: {
    LOGIN: `${API_URL}/admin/loginadmin`,
    ADD_STAFF: `${API_URL}/admin/addstaff`,
    GET_STAFF_BY_DEPT: `${API_URL}/admin/getstaffbydept`,
    DEPT_COMPLAINTS: `${API_URL}/admin/deptcomp`,
  },
  
  // ML/LLM Endpoints
  ML: {
    // Image/Video Classification
    PREDICT_IMAGE: `${ML_SERVER_URL}/v1/predictimage`,
    PREDICT_VIDEO: `${ML_SERVER_URL}/v1/predictvideo`,
    UPLOAD: `${ML_SERVER_URL}/v1/upload`,
    GET_IMAGE: (filename) => `${ML_SERVER_URL}/v1/get_image/${filename}`,
    
    // Text Analysis
    TEXT_CATEGORY: `${ML_SERVER_URL}/v1/text/text_category`,
    TEXT_SUBCATEGORY: `${ML_SERVER_URL}/v1/text/text_subcategory`,
    TRANSLATE: `${ML_SERVER_URL}/v1/translate`,
    
    // Severity Analysis
    SEAT_PRIORITY: `${ML_SERVER_URL}/v1/severity/seat_priority`,
    WINDOW_PRIORITY: `${ML_SERVER_URL}/v1/severity/win_priority`,
    COMPARTMENT_SEVERITY: `${ML_SERVER_URL}/v1/severity/comp_severity`,
    
    // Special Analysis
    VIOLENCE_SEVERITY: `${ML_SERVER_URL}/v1/violence/violence_severity`,
    OCR_EXTRACTION: `${ML_SERVER_URL}/v1/ocr/ocr_extraction`,
    FEEDBACK_SENTIMENT: `${ML_SERVER_URL}/v1/review_analysis/feedback_sentiment`,
  },
};

// Helper function to get media URL
export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return '';
  return `${ML_SERVER_URL}/v1${mediaPath}`;
};

// Export individual constants for backwards compatibility
export const ML_SERVER = API_CONFIG.ML_API;
export const API_BASE = API_CONFIG.API_BASE;

export default API_CONFIG;
