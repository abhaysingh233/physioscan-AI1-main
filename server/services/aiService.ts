import { GoogleGenAI } from "@google/genai";

export const getAIClient = () => {
  let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (apiKey && ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'")))) {
    apiKey = apiKey.slice(1, -1);
  }
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "MY_GEMINI_API_KEY") {
    console.error("❌ API Key is missing or invalid!");
    throw new Error("API Key is not configured");
  }
  return new GoogleGenAI({ apiKey });
};

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

export async function generateAIContent(prompt: string, expectJson: boolean = false, modelName: string = "gemini-flash-latest", extraConfig: any = {}) {
  const ai = getAIClient();
  const config: any = { ...extraConfig };
  
  if (expectJson) {
    config.responseMimeType = "application/json";
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config,
  });

  if (expectJson) {
    return cleanAndParseJSON(response.text || "{}");
  }

  return response.text;
}
