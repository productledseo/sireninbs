import { GoogleGenAI } from "@google/genai";

async function findApi() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "What is the API endpoint for fetching alerts history from tzevaadom.co.il? I need the JSON endpoint that the website https://www.tzevaadom.co.il/en/historical/ uses.",
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  console.log(response.text);
}

findApi();
