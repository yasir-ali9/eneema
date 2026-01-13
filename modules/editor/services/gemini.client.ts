import { GoogleGenAI } from "@google/genai";

// Shared Gemini Client Instance
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
