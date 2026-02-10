// LLM Fallback Service - Uses free Cerebras and Gemini APIs
// Provides fallback when ML backend APIs fail

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API // Free tier Gemini API key
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY; // Free Cerebras API key

// Category and department mappings
const CATEGORY_DEPT_MAP = {
  seat: "Mechanical",
  window: "Mechanical",
  food: "Catering",
  compartment: "Hygiene",
  toilet: "Hygiene",
  violence: "Security",
  management: "Management",
  "ticketing issue": "Commercial",
  security: "Security",
  electricity: "Electrical",
  medical: "Medical",
};

const CATEGORY_SUBCATEGORIES = {
  seat: ["Torn Seat", "Broken Seat", "Dirty Seat"],
  window: ["Cracked Window", "Broken Window", "Dirty Window"],
  food: ["Spoilt Food", "Food Quality", "Overcharged"],
  compartment: ["Dirty Coach", "Door Issue", "Garbage"],
  toilet: ["Unhygienic Toilet", "No Water", "Flush Issue"],
  violence: ["Staff Misbehaviour", "Passenger Violence", "Smoking"],
  management: ["Train Delay", "Missing Items", "App Issue"],
  "ticketing issue": ["Wrong Ticket", "Refund Issue"],
  security: ["Theft", "Misbehaviour", "Unauthorized Entry"],
  electricity: ["AC Issue", "Light Issue", "Fan Issue", "Charging Port"],
  medical: ["Medical Assistance", "First Aid Kit"],
};

// Fallback category prediction using keyword matching (no API needed)
export const predictCategoryFallback = (text) => {
  if (!text || text.trim() === "") return { category: "management", subcategory: "App Issue" };

  const lowerText = text.toLowerCase();

  const keywords = {
    seat: ["seat", "chair", "broken seat", "torn", "cushion", "berth", "bedroll"],
    window: ["window", "glass", "pane", "crack", "shattered"],
    food: ["food", "meal", "eat", "taste", "stale", "expired", "pantry", "catering", "costly", "overcharged", "price"],
    compartment: ["coach", "compartment", "dirty", "garbage", "filthy", "unclean", "door", "latch"],
    toilet: ["toilet", "bathroom", "washroom", "basin", "flush", "water", "lavatory", "washbasin"],
    violence: ["violence", "fight", "abuse", "misbehav", "drunk", "smoking", "alcohol", "bribe", "molest", "harass"],
    management: ["delay", "late", "waiting", "manage", "lost", "missing", "app"],
    "ticketing issue": ["ticket", "booking", "refund", "money", "payment", "wrong ticket", "pnr"],
    security: ["theft", "rob", "steal", "unauthorized", "suspicious", "stranger", "criminal", "chain pull"],
    electricity: ["ac", "air condition", "fan", "light", "electric", "charging", "charger", "power", "switch"],
    medical: ["medical", "doctor", "health", "sick", "emergency", "injured", "pain", "medicine", "first aid"],
  };

  let bestCategory = "management";
  let bestScore = 0;

  for (const [cat, words] of Object.entries(keywords)) {
    let score = 0;
    for (const word of words) {
      if (lowerText.includes(word)) {
        score += word.length; // Longer matches are weighted higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  // Pick first subcategory as default
  const subcategories = CATEGORY_SUBCATEGORIES[bestCategory] || ["General Issue"];
  
  // Try to pick a relevant subcategory
  let bestSubcategory = subcategories[0];
  for (const sub of subcategories) {
    if (lowerText.includes(sub.toLowerCase().split(" ")[0])) {
      bestSubcategory = sub;
      break;
    }
  }

  return { category: bestCategory, subcategory: bestSubcategory };
};

// Get department from category
export const getDeptFromCategory = (category) => {
  return CATEGORY_DEPT_MAP[category] || "Management";
};

// Fallback severity calculation (no API needed)
export const calculateSeverityFallback = (category, subcategory) => {
  const categoryWeights = {
    seat: 8,
    window: 7,
    food: 4,
    compartment: 6,
    toilet: 1,
    violence: 9,
    management: 5,
    "ticketing issue": 3,
    security: 8,
    electricity: 2,
    medical: 10,
  };

  const base = categoryWeights[category] || 5;
  const subcategories = CATEGORY_SUBCATEGORIES[category] || [];
  const idx = subcategories.findIndex(
    (s) => s.toLowerCase() === (subcategory || "").toLowerCase()
  );
  const subWeight = idx >= 0 ? (idx + 1) / subcategories.length : 0.5;

  return parseFloat((base + subWeight).toFixed(2));
};

// Try Gemini API for category prediction
export const predictCategoryWithGemini = async (text) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a railway complaint classifier. Classify this complaint into exactly one category and one subcategory.
                  
Categories and their subcategories:
- seat: Torn Seat, Broken Seat, Dirty Seat
- window: Cracked Window, Broken Window, Dirty Window
- food: Spoilt Food, Food Quality, Overcharged
- compartment: Dirty Coach, Door Issue, Garbage
- toilet: Unhygienic Toilet, No Water, Flush Issue
- violence: Staff Misbehaviour, Passenger Violence, Smoking
- management: Train Delay, Missing Items, App Issue
- ticketing issue: Wrong Ticket, Refund Issue
- security: Theft, Misbehaviour, Unauthorized Entry
- electricity: AC Issue, Light Issue, Fan Issue, Charging Port
- medical: Medical Assistance, First Aid Kit

Complaint: "${text}"

Respond ONLY in this exact JSON format:
{"category": "category_name", "subcategory": "subcategory_name"}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API failed");

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid Gemini response");
  } catch (err) {
    console.warn("Gemini fallback failed:", err.message);
    return null;
  }
};

// Try Cerebras API for category prediction
export const predictCategoryWithCerebras = async (text) => {
  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: `You are a railway complaint classifier. Classify complaints into categories. 
Valid categories: seat, window, food, compartment, toilet, violence, management, ticketing issue, security, electricity, medical.
Respond ONLY in JSON: {"category": "...", "subcategory": "..."}`,
          },
          {
            role: "user",
            content: `Classify: "${text}"`,
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) throw new Error("Cerebras API failed");

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid Cerebras response");
  } catch (err) {
    console.warn("Cerebras fallback failed:", err.message);
    return null;
  }
};

// Master predict function - tries ML API → Cerebras → Gemini → keyword fallback
export const predictCategory = async (text, mlApiUrl = null) => {
  // Try ML backend first
  if (mlApiUrl) {
    try {
      const response = await fetch(mlApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: text }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.category) {
          return { category: data.category, subcategory: data.subcategory || "", source: "ml" };
        }
      }
    } catch (err) {
      console.warn("ML backend failed, trying LLM fallbacks...");
    }
  }

  // Try Cerebras first (faster)
  const cerebrasResult = await predictCategoryWithCerebras(text);
  if (cerebrasResult) {
    return { ...cerebrasResult, source: "cerebras" };
  }

  // Try Gemini as fallback
  const geminiResult = await predictCategoryWithGemini(text);
  if (geminiResult) {
    return { ...geminiResult, source: "gemini" };
  }

  // Final fallback - keyword matching
  const fallback = predictCategoryFallback(text);
  return { ...fallback, source: "keyword" };
};

// OCR fallback using Gemini Vision
export const ocrWithGemini = async (imageFile) => {
  try {
    const base64 = await fileToBase64(imageFile);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract all text from this ticket/document image. Look for Train Number (4-5 digit number), PNR Number (10 digit number or XXX-XXXXXXX format), and Ticket Number (8 digit number). 
Respond ONLY in JSON format:
{"detected_text": "all text found", "train_number": "found or Not Found", "pnr_number": "found or Not Found", "ticket_number": "found or Not Found"}`,
                },
                {
                  inline_data: {
                    mime_type: imageFile.type || "image/jpeg",
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini OCR failed");

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = content.match(/\{[^}]+\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid OCR response");
  } catch (err) {
    console.warn("Gemini OCR fallback failed:", err.message);
    return null;
  }
};

// Image classification fallback using Gemini Vision
export const classifyImageWithGemini = async (imageFile) => {
  try {
    const base64 = await fileToBase64(imageFile);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an Indian Railways complaint image classifier. Classify this image into exactly one category and one subcategory.

Categories and their subcategories:
- seat: Torn Seat, Broken Seat, Dirty Seat
- window: Cracked Window, Broken Window, Dirty Window
- food: Spoilt Food, Food Quality, Overcharged
- compartment: Dirty Coach, Door Issue, Garbage
- toilet: Unhygienic Toilet, No Water, Flush Issue
- violence: Staff Misbehaviour, Passenger Violence, Smoking
- security: Theft, Misbehaviour, Unauthorized Entry
- electricity: AC Issue, Light Issue, Fan Issue, Charging Port
- medical: Medical Assistance, First Aid Kit

Also estimate severity from 0.1 to 10 (10 being most severe).

Respond ONLY in JSON:
{"category": "...", "subcategory": "...", "severity": 5.0, "description": "brief description of what you see"}`,
                },
                {
                  inline_data: {
                    mime_type: imageFile.type || "image/jpeg",
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini image classification failed");

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = content.match(/\{[^}]+\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid classification response");
  } catch (err) {
    console.warn("Gemini image classification failed:", err.message);
    return null;
  }
};

// Helper: Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // Remove data:xxx;base64, prefix
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export { CATEGORY_DEPT_MAP, CATEGORY_SUBCATEGORIES };

// Confirm/verify ML prediction with LLM when confidence is low
export const confirmCategoryWithLLM = async (mlCategory, mlSubcategory, imageFile) => {
  try {
    const base64 = await fileToBase64(imageFile);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `An ML model classified this Indian Railways complaint image as:
Category: "${mlCategory}"
Subcategory: "${mlSubcategory || "unknown"}"

Please verify this classification. If it seems correct, return the same. If not, provide the correct one.

Valid categories: seat, window, food, compartment, toilet, violence, management, ticketing issue, security, electricity, medical.

Respond ONLY in JSON:
{"category": "...", "subcategory": "...", "confidence": "high/medium/low", "corrected": true/false}`,
                },
                {
                  inline_data: {
                    mime_type: imageFile.type || "image/jpeg",
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini confirm failed");
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = content.match(/\{[^}]+\}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (err) {
    console.warn("LLM confirmation failed:", err.message);
    return null;
  }
};
