import { Request, Response } from "express";
import { generateAIContent } from "../services/aiService";

export const analyzeAyurveda = async (req: Request, res: Response) => {
  try {
    const { query, language } = req.body;

    const prompt = `
User Query: ${query}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

You are an advanced Ayurvedic Intelligence System integrated into "PhysioScan AI".
Analyze the user's health concern from an Ayurvedic perspective.

RESPONSE STRUCTURE (STRICT JSON FORMAT):
Return a JSON object with the following keys:
- "treatments": array of objects, each with:
    - "name": string (Name of the treatment/remedy)
    - "benefits": array of strings (2-3 key benefits)
    - "how_to_use": string (Clear instructions on preparation and consumption)
    - "precaution": string (Safety warning or when to avoid)
- "lifestyle_tips": array of 4 strings (Ayurvedic lifestyle advice related to the concern)
- "dosha_impact": string (Markdown explaining which Dosha is likely aggravated and why, and how the treatments balance it)
- "herbal_recommendations": array of 3-4 specific Ayurvedic herbs related to the query.

STRICT RULES:
1. Provide the response in ${language === 'hi' ? 'Hindi' : 'English'}.
2. Focus on traditional Ayurvedic wisdom (Vata, Pitta, Kapha, Agni, Ojas).
3. Ensure the advice is safe and natural.
4. Keep the tone professional, empathetic, and wise.
`;

    const result = await generateAIContent(prompt, true);
    res.json(result);
  } catch (error: any) {
    console.error("Error in Ayurvedic analysis:", error);
    res.status(500).json({ error: error.message || "Failed to analyze Ayurvedic wisdom" });
  }
};
