
// Import generative AI from CDN
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

export function createGeminiClient() {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? 'AIzaSyD1MOJwy4aj91ZThQsOplN-DQfKHz9DN88';
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-pro" });
}
