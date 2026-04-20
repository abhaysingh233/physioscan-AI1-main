import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const genAI = new GoogleGenAI({ apiKey });
  
  try {
    const models = await genAI.models.list();
    console.log("Available models:");
    console.log(JSON.stringify(models, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
