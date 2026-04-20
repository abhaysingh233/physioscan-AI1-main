import { Request, Response } from "express";
import { generateAIContent } from "../services/aiService";
import db from "../db/database";

export const analyzeSymptoms = async (req: Request, res: Response) => {
  try {
    const { symptoms, age, gender, language } = req.body;
    const userId = (req.session as any).userId;

    let recentSymptoms = [];
    
    if (userId) {
      recentSymptoms = db.prepare("SELECT * FROM symptoms WHERE user_id = ? ORDER BY date DESC LIMIT 5").all(userId);
    }

    const prompt = `
User Current Symptoms: ${symptoms}
User Profile Data: ${JSON.stringify({ age, gender })}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

Medical History Context:
Recent Symptoms History: ${JSON.stringify(recentSymptoms)}

Analyze the symptoms and provide health guidance based on the following STRICT rules:

ROLE:
You are an advanced AI healthcare assistant integrated into "PhysioScan AI – Smart Health Intelligence System".
Your role is to analyze user symptoms and provide safe, structured, and beginner-friendly health guidance.
You have access to the user's recent medication and symptom history—use this to provide more personalized insights.

IMPORTANT RULES:
- You are NOT a doctor. Do not give final diagnosis.
- Do NOT suggest prescription-only medicines.
- Always include a safety disclaimer: "Consult a doctor before taking any medication."
- Focus on prevention and safe advice.
- Provide the ENTIRE response in ${language === 'hi' ? 'Hindi' : 'English'}.

RESPONSE STRUCTURE (STRICT JSON FORMAT):
Return a JSON object with the following keys:
- "top_predictions": array of exactly 3 objects, each with "disease" (string) and "confidence" (number between 1-100 representing percentage)
- "severity": string (must be exactly "Low", "Moderate", "High", or "Emergency")
- "recommended_specialist": string (e.g., "Neurologist", "Cardiologist", "General Physician" - the best doctor to see for these symptoms)
- "detailed_analysis": string (markdown formatted detailed analysis covering possible causes, when to see a doctor, lifestyle, etc.)
`;

    const analysis = await generateAIContent(prompt, true);
    
    // Save prediction to database
    try {
      const stmt = db.prepare("INSERT INTO predictions (user_id, symptoms, predictions_json, severity) VALUES (?, ?, ?, ?)");
      stmt.run(userId || null, symptoms, JSON.stringify(analysis.top_predictions), analysis.severity);
    } catch (dbError) {
      console.error("Failed to save prediction to DB:", dbError);
    }

    res.json(analysis);
  } catch (error: any) {
    console.error("Error analyzing symptoms:", error);
    res.status(500).json({ error: error.message || "Failed to analyze symptoms" });
  }
};

export const getDiet = async (req: Request, res: Response) => {
  try {
    const { condition, language } = req.body;

    const prompt = `
Provide a detailed diet plan for a person suffering from or recovering from: ${condition}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

RESPONSE STRUCTURE (STRICT JSON FORMAT):
Return a JSON object with the following keys:
- "diet_plan": object containing:
  - "foods_to_eat": array of strings (specific foods beneficial for recovery)
  - "foods_to_avoid": array of strings (foods that can worsen the condition)
  - "meal_plan": object with "breakfast", "lunch", and "dinner" (string descriptions of suggested meals)
`;

    const dietPlan = await generateAIContent(prompt, true);
    
    // Save diet plan to database
    try {
      const userId = (req.session as any).userId;
      if (userId) {
        const stmt = db.prepare("INSERT INTO diet_plans (user_id, condition, plan_json) VALUES (?, ?, ?)");
        stmt.run(userId, condition, JSON.stringify(dietPlan.diet_plan));
      }
    } catch (dbError) {
      console.error("Failed to save diet plan to DB:", dbError);
    }

    res.json(dietPlan);
  } catch (error: any) {
    console.error("Error getting diet plan:", error);
    res.status(500).json({ error: error.message || "Failed to get diet plan" });
  }
};

export const getRemedies = async (req: Request, res: Response) => {
  try {
    const { condition, language } = req.body;

    const prompt = `
Provide ayurvedic remedies and precautions for a person suffering from: ${condition}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

RESPONSE STRUCTURE (STRICT JSON FORMAT):
Return a JSON object with the following keys:
- "ayurvedic_remedies": array of objects, each with "remedy" (string, e.g., "Tulsi tea"), "dosage" (string, e.g., "Drink twice daily"), and "duration" (string, e.g., "for 5 days"). Make these highly specific to the condition.
- "precautions": array of strings (e.g., "Avoid cold drinks", "Rest recommended")
`;

    const remedies = await generateAIContent(prompt, true);
    res.json(remedies);
  } catch (error: any) {
    console.error("Error getting remedies:", error);
    res.status(500).json({ error: error.message || "Failed to get remedies" });
  }
};
