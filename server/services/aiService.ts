import { GoogleGenAI } from "@google/genai";

export const getAIClient = () => {
  const DEMO_MODE = process.env.DEMO_MODE === "true";
  
  if (DEMO_MODE) {
    console.log("🎭 DEMO MODE ENABLED - Using mock AI responses");
    return null;
  }

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

// Mock data generator for demo mode
function generateMockSymptomAnalysis(symptoms: string, language: string) {
  const mockResponses = {
    ayurvedic_insight: language === 'hi' 
      ? "आपके लक्षण वात दोष के असंतुलन को दर्शाते हैं। तंत्रिका तंत्र में सूखापन और गतिविधि में वृद्धि के कारण ये समस्याएं हो रही हैं। आयुर्वेद के अनुसार, गर्म तेल मालिश, ध्यान और गर्म खाद्य पदार्थ सहायक होंगे।"
      : "Your symptoms indicate a Vata (Air) imbalance. The nervous system shows dryness and excessive movement. Ayurveda suggests warming treatments like oil massage, meditation, and warming foods can help restore balance.",
    
    top_predictions: [
      { disease: "Common Cold / Viral Infection", confidence: 45 },
      { disease: "Migraine / Tension Headache", confidence: 35 },
      { disease: "Stress-Related Syndrome", confidence: 20 }
    ],
    
    severity: "Moderate",
    
    recommended_specialist: "General Physician",
    
    detailed_analysis: language === 'hi'
      ? "## विस्तृत विश्लेषण\n\n### संभावित कारण:\n- वायरल संक्रमण\n- तनाव और चिंता\n- नींद की कमी\n- मौसमी परिवर्तन\n\n### डॉक्टर से कब मिलें:\n- यदि लक्षण 5 दिन से अधिक बने रहें\n- तेज बुखार (101°F से अधिक)\n- गंभीर सिरदर्द\n\n### जीवनशैली सुझाव:\n- 7-8 घंटे की नींद लें\n- तरल पदार्थ का अधिक सेवन करें\n- गर्म खाना खाएं\n- तनाव कम करने के लिए योग करें"
      : "## Detailed Analysis\n\n### Possible Causes:\n- Viral infection\n- Stress and anxiety\n- Sleep deprivation\n- Seasonal changes\n\n### When to See a Doctor:\n- If symptoms persist beyond 5 days\n- High fever (above 101°F)\n- Severe headache\n\n### Lifestyle Suggestions:\n- Get 7-8 hours of sleep\n- Increase fluid intake\n- Eat warm, nutritious foods\n- Practice yoga for stress relief"
  };
  
  return mockResponses;
}

function generateMockDietPlan(condition: string, language: string) {
  const mockDiet = {
    diet_plan: {
      foods_to_eat: language === 'hi'
        ? ["गर्म दूध", "खिचड़ी", "मूंग दाल", "गर्म शोरबा", "सेब", "अदरक", "हल्दी"]
        : ["Warm milk", "Khichdi", "Mung lentils", "Warm broth", "Apple", "Ginger", "Turmeric"],
      
      foods_to_avoid: language === 'hi'
        ? ["ठंडे पानी का सेवन", "तैलीय भोजन", "मसालेदार खाना", "डिब्बाबंद खाद्य पदार्थ", "कच्चे फल"]
        : ["Cold water", "Oily foods", "Spicy meals", "Canned foods", "Raw fruits"],
      
      meal_plan: {
        breakfast: language === 'hi'
          ? "गर्म दलिया दूध के साथ या हल्के पकौड़े"
          : "Warm oatmeal with milk or light pancakes",
        
        lunch: language === 'hi'
          ? "खिचड़ी, दही और सब्जियों का सूप"
          : "Khichdi with yogurt and vegetable soup",
        
        dinner: language === 'hi'
          ? "हल्का सूप और पके हुए सब्जियां"
          : "Light soup and cooked vegetables"
      }
    }
  };
  
  return mockDiet;
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

export async function generateAIContent(prompt: string, expectJson: boolean = false, modelName: string = "gemini-2.0-flash", extraConfig: any = {}) {
  const DEMO_MODE = process.env.DEMO_MODE === "true";
  
  // Demo mode - return mock data
  if (DEMO_MODE) {
    console.log("🎭 Using mock response for:", prompt.substring(0, 50) + "...");
    if (prompt.includes("Analyze the symptoms")) {
      const language = prompt.includes("Hindi") ? "hi" : "en";
      return generateMockSymptomAnalysis("symptoms", language);
    } else if (prompt.includes("Provide a detailed diet plan")) {
      const language = prompt.includes("Hindi") ? "hi" : "en";
      return generateMockDietPlan("condition", language);
    }
    
    // Generic mock response for other prompts
    return expectJson ? { response: "Mock response" } : "This is a mock AI response for demonstration purposes.";
  }

  // Real API mode
  const ai = getAIClient();
  const config: any = { ...extraConfig };
  
  if (expectJson) {
    config.responseMimeType = "application/json";
  }

  const response = await ai!.models.generateContent({
    model: modelName,
    contents: prompt,
    config,
  });

  if (!response.text) {
    throw new Error("AI returned an empty response");
  }

  if (expectJson) {
    return cleanAndParseJSON(response.text);
  }

  return response.text;
}
