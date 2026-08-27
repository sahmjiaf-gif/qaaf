
import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    // In Vite, process.env.GEMINI_API_KEY is usually replaced by define or available via import.meta.env
    // We use a fallback to empty string to avoid crashes, but the API call will fail later if empty.
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "";
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const translateContent = async (content: any, targetLang: 'ar' | 'en') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following JSON content to ${targetLang === 'ar' ? 'Arabic' : 'English'}. 
      Keep the JSON structure exactly the same. 
      Only translate the string values. 
      Content: ${JSON.stringify(content)}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Translation error:", error);
    return content; // Fallback to original content
  }
};
