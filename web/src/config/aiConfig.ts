import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("⚠️ [AI] NEXT_PUBLIC_GEMINI_API_KEY is missing! Real AI will be disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

export const SYSTEM_PROMPT = `You are the ActivityMind AI Architect. Design/adapt creative team activities. 
Return valid JSON:
{
  "message": "Friendly summary incorporating company name/industry.",
  "suggestedActivities": [
    {
      "name": "Activity Name",
      "category": "Icebreaker | Team Bonding | Wellness | Recognition | Festival | Training",
      "description": "Short engaging description.",
      "duration": "15 min | 30 min | 1 hour | Half Day",
      "estimated_cost": "Low | Medium | High",
      "min_employees": 2,
      "max_employees": 20,
      "steps": "[\\"Step 1\\", \\"Step 2\\"]",
      "materials": "[\\"Item 1\\", \\"Item 2\\"]",
      "indoor_outdoor": "Indoor | Outdoor | Both",
      "remote_compatible": 1 | 0
    }
  ]
}
RULES:
1. "category" MUST be one of the listed 6 options in the schema. Keep it short.
2. "estimated_cost" MUST be "Low", "Medium", or "High".
3. "min_employees" and "max_employees" MUST be numbers (e.g. 2 and 20).
4. Personalize the "message" with the company name.`;
