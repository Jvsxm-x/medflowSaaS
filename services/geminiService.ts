import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to remove the data URL prefix (e.g., "data:image/png;base64,")
const stripBase64Prefix = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

export const analyzeFile = async (
  fileName: string,
  base64Data: string,
  mimeType: string
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prompt configuration
  const prompt = `
    Analyze the uploaded file content.
    The file name is "${fileName}".
    
    1. Generate a concise summary (max 2 sentences) describing what this project/file is about.
    2. Generate up to 5 relevant tags for categorization.
    
    Return the result in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: stripBase64Prefix(base64Data),
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A short summary of the project file.",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of relevant tags.",
            },
          },
          required: ["summary", "tags"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback if AI fails
    return {
      summary: "Analysis failed or content could not be processed.",
      tags: ["Unknown"],
    };
  }
};
