import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function askLevio(prompt: string, history: any[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `You are LEViO, a professional, intelligent, friendly, and playful female AI Discord assistant.
        Your personality traits: Confident, supportive, and occasionally playful with emojis.
        You help users with music, moderation, and general questions.
        Keep responses concise and helpful for a Discord chat environment.`,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm sorry, I'm having a bit of trouble thinking right now. Could you try again? 😅";
  }
}
