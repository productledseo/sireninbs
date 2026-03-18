
import { GoogleGenAI } from "@google/genai";

async function findEndpoint() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "I am trying to find the JSON API endpoint for fetching historical alerts from https://www.tzevaadom.co.il/en/historical/. I have tried /api/alerts/history and /api/v1/alerts/history but they return 404. Do you know the correct endpoint? It is likely used by the React frontend of the site.",
  });
  console.log(response.text);
}

findEndpoint();
