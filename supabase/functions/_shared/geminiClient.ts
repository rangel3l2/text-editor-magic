import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

export class GeminiClient {
  private model;
  
  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async analyzeContent(content: string, prompts: { type: string, section?: string }[]): Promise<any> {
    try {
      let combinedPrompt = "";
      
      prompts.forEach((prompt, index) => {
        switch (prompt.type) {
          case "title":
            combinedPrompt += `
              Análise do título do banner acadêmico:
              "${content}"
              
              Critérios de análise:
              1. Clareza e Objetividade:
                 - O título deve ser claro e direto
                 - Deve informar o tema principal do trabalho
                 - Evitar termos ambíguos ou muito técnicos
              
              2. Número de Palavras:
                 - Ideal: entre 6 e 8 palavras
                 - Máximo: 12 palavras
              
              3. Aspectos Técnicos:
                 - Verificar erros ortográficos
                 - Analisar coesão e coerência
                 - Verificar pontuação
            `;
            break;
          case "content":
            combinedPrompt += `
              Análise do texto para a seção "${prompt.section}" do banner acadêmico:
              "${content}"
              
              Critérios:
              1. Adequação ao formato banner
              2. Clareza e objetividade
              3. Coerência e coesão
              4. Gramática e ortografia
            `;
            break;
        }
        
        if (index < prompts.length - 1) {
          combinedPrompt += "\n\n---\n\n";
        }
      });

      combinedPrompt += `\n\nResposta DEVE ser um objeto JSON com esta estrutura:
      {
        "isValid": boolean,
        "redundancyIssues": string[],
        "contextIssues": string[],
        "grammarErrors": string[],
        "suggestions": string[],
        "overallFeedback": string
      }`;

      console.log('Sending combined prompt to Gemini:', combinedPrompt);
      
      const result = await this.model.generateContent(combinedPrompt);
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