import { GoogleGenAI } from "@google/genai";

export const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null);
  if (!apiKey) {
    console.error("❌ API Key is missing or invalid!");
    throw new Error("API Key is not configured");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateAIContent(prompt: string, isJson: boolean = false, model: string = "gemini-2.0-flash", config?: any) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      ...config,
      ...(isJson ? { responseMimeType: "application/json" } : {})
    }
  });
  
  if (isJson) {
    return cleanAndParseJSON(response.text || "{}");
  }
  return response;
}

export function cleanAndParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]);
        } catch (e3) { /* ignore */ }
      }
      const objectMatch = cleaned.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e4) { /* ignore */ }
      }
      throw new Error("Failed to parse JSON response");
    }
  }
}
