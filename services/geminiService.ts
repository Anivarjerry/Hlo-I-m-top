
import { GoogleGenAI, Type } from "@google/genai";
import { ZipFileEntry, AnalysisResponse } from "../types";

export const analyzeCodebase = async (files: ZipFileEntry[]): Promise<AnalysisResponse> => {
  // Use the process.env.API_KEY directly for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a condensed version of the codebase for analysis
  const codebaseSnapshot = files
    .filter(f => !f.isFolder && f.content.length > 0)
    .slice(0, 20) // Limit to top 20 files to avoid token overflow
    .map(f => `File: ${f.path}\nContent:\n${f.content.substring(0, 1000)}`)
    .join('\n\n---\n\n');

  const prompt = `Analyze this project codebase and provide a summary, key features, and improvement suggestions. 
  Focus on architecture, potential bugs, and code quality.
  
  Codebase Snapshot:
  ${codebaseSnapshot}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Executive summary of the project." },
          keyFeatures: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Main features or architectural patterns identified."
          },
          suggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Constructive feedback or optimization tips."
          }
        },
        required: ["summary", "keyFeatures", "suggestions"],
        propertyOrdering: ["summary", "keyFeatures", "suggestions"]
      }
    }
  });

  try {
    // Correctly extract the generated text output from the response object
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    return {
      summary: response.text || "Analysis complete.",
      keyFeatures: [],
      suggestions: []
    };
  }
};
