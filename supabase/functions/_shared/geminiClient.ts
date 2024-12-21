import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

export class GeminiClient {
  private model;
  
  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async analyzeText(content: string, section: string): Promise<any> {
    try {
      const prompt = `
        Você é um especialista em análise de textos acadêmicos.
        Analise o seguinte texto para a seção "${section}" de um banner acadêmico.
        
        Texto a ser analisado:
        "${content}"

        Responda APENAS com um objeto JSON com esta estrutura:
        {
          "isValid": boolean,
          "redundancyIssues": string[],
          "contextIssues": string[],
          "grammarErrors": string[],
          "suggestions": string[],
          "overallFeedback": string
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Formato de resposta inválido do Gemini');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error in Gemini analysis:', error);
      throw error;
    }
  }
}