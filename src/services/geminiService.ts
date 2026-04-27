import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PropertyAnalysis {
  rating: 'Good' | 'Fair' | 'Bad';
  summary: string;
  pros: string[];
  cons: string[];
  recommendation: string;
}

export async function analyzeDeal(property: any, marketTrends: any[]): Promise<PropertyAnalysis> {
  const prompt = `
    Analyze this commercial real estate deal in Inland Empire:
    Property: ${JSON.stringify(property)}
    Recent Market Trends: ${JSON.stringify(marketTrends)}

    Determine if this is a "Good", "Fair", or "Bad" deal based on capitalization rates, price per square foot, and occupancy compared to trends.
    Provide a concise summary, pros, cons, and a specific recommendation for a broker.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.STRING, enum: ['Good', 'Fair', 'Bad'] },
            summary: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING },
          },
          required: ['rating', 'summary', 'pros', 'cons', 'recommendation']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Deal analysis failed:", error);
    throw error;
  }
}

export async function getBrokerDailyBriefing(trends: any[]): Promise<string> {
  const prompt = `
    You are a senior real estate broker expert in the Inland Empire (Riverside, San Bernardino, Ontario, etc.) region.
    Given these recent market trends: ${JSON.stringify(trends)}
    Provide a brief, high-energy "Daily Briefing" for brokers.
    What's the best thing to do right now in IE? (e.g., focus on retail, look for value-add industrial, etc.)
    Keep it professional but accessible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Market is steady. Focus on relationship building in high-growth San Bernardino pockets.";
  } catch (error) {
    console.error("Briefing failed:", error);
    return "Unable to fetch AI briefing at this time.";
  }
}
