
import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport, RiskLevel } from "../types";

export const analyzeProjectPlan = async (plan: string): Promise<AuditReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: plan,
    config: {
      systemInstruction: `You are an expert project reviewer and risk analyst. 
      Your role is to evaluate project plans BEFORE execution and identify early warning signs that could lead to project failure.
      
      Evaluation criteria:
      1. Goal clarity
      2. Ownership and responsibility
      3. Timeline realism
      4. Task structure and dependencies
      5. Scope definition and ambiguity

      TASKS:
      - Assign a 'severity' level to each risk (High, Medium, Low).
      - Provide a catchy, professional 'suggestedProjectName' (2-4 words) that summarizes the plan if the user didn't name it.
      
      Return the analysis in valid JSON format only.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: {
            type: Type.STRING,
            description: "Low, Medium, or High (Overall Project Level)",
          },
          riskJustification: {
            type: Type.STRING,
            description: "A one-sentence justification for the overall risk level.",
          },
          suggestedProjectName: {
            type: Type.STRING,
            description: "A professional, concise name for the project (e.g., 'Legacy DB Migration').",
          },
          topRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Clear name of the risk." },
                why: { type: Type.STRING, description: "Explanation of why this is a risk." },
                reference: { type: Type.STRING, description: "Direct reference from the plan." },
                severity: { type: Type.STRING, description: "High, Medium, or Low" },
              },
              required: ["name", "why", "reference", "severity"],
            },
            description: "The top 3 risks identified.",
          },
          fixNowSuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                riskName: { type: Type.STRING, description: "The name of the risk being addressed." },
                action: { type: Type.STRING, description: "One concrete, specific suggestion." },
              },
              required: ["riskName", "action"],
            },
            description: "One suggestion per risk.",
          },
        },
        required: ["riskLevel", "riskJustification", "suggestedProjectName", "topRisks", "fixNowSuggestions"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI service.");
  
  try {
    const data = JSON.parse(text);
    return data as AuditReport;
  } catch (e) {
    console.error("Failed to parse AI response", text);
    throw new Error("Invalid response format from AI service.");
  }
};
