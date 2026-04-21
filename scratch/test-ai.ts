import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

async function test() {
  let apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  console.log("Using API Key:", apiKey ? "FOUND" : "NOT FOUND");
  
  const client = new GoogleGenAI({ apiKey });
  
  try {
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Hello, how are you?",
    });
    console.log("Response:", response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
