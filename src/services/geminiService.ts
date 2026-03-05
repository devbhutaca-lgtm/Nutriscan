import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
  fat: number;
  saturated_fat: number;
  trans_fat: number;
  sodium: number;
}

export interface AnalysisResult {
  label: "Avoid" | "Not healthy" | "Moderate" | "Healthy";
  score: number;
  summary: string;
  positives: string[];
  negatives: string[];
  ingredientJustification: string;
  consumptionGuidance: {
    portion: string;
    frequency: string;
    calorieImpact: string;
  };
  makeItHealthier: string[];
  recipes: Recipe[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  healthNote: string;
}

export async function analyzeProduct(
  name: string,
  brand: string,
  nutrition: NutritionData,
  ingredients: string,
  dietPreference: string = "none"
): Promise<AnalysisResult> {
  const prompt = `
    Analyze the following food product for healthiness.
    Product: ${name} by ${brand}
    Diet Preference: ${dietPreference}
    Nutrition (per serving): ${JSON.stringify(nutrition)}
    Ingredients: ${ingredients}

    Provide a health score (0-100) and a label (Avoid, Not healthy, Moderate, Healthy).
    Also provide a detailed explanation, consumption guidance, and 4-5 healthy recipes using this product.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, enum: ["Avoid", "Not healthy", "Moderate", "Healthy"] },
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          positives: { type: Type.ARRAY, items: { type: Type.STRING } },
          negatives: { type: Type.ARRAY, items: { type: Type.STRING } },
          ingredientJustification: { type: Type.STRING },
          consumptionGuidance: {
            type: Type.OBJECT,
            properties: {
              portion: { type: Type.STRING },
              frequency: { type: Type.STRING },
              calorieImpact: { type: Type.STRING }
            },
            required: ["portion", "frequency", "calorieImpact"]
          },
          makeItHealthier: { type: Type.ARRAY, items: { type: Type.STRING } },
          recipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                calories: { type: Type.NUMBER },
                healthNote: { type: Type.STRING }
              },
              required: ["id", "name", "description", "ingredients", "instructions", "calories", "healthNote"]
            }
          }
        },
        required: ["label", "score", "summary", "positives", "negatives", "ingredientJustification", "consumptionGuidance", "makeItHealthier", "recipes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
