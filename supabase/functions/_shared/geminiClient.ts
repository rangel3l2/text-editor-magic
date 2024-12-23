import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

export class GeminiClient {
  private model;
  private maxRetries = 2;
  private baseDelay = 1000; // 1 second
  
  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.maxRetries || 
          !error.message?.includes('429')) {
        throw error;
      }

      const delayMs = this.baseDelay * Math.pow(2, attempt);
      console.log(`Retrying after ${delayMs}ms (attempt ${attempt + 1})`);
      await this.delay(delayMs);
      
      return this.retryWithExponentialBackoff(operation, attempt + 1);
    }
  }

  async analyzeContent(content: string, prompts: { type: string, section?: string }[]): Promise<any> {
    return this.retryWithExponentialBackoff(async () => {
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
        
        console.log('Raw Gemini response:', text);

        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('Invalid response format from Gemini');
          }

          const parsedJson = JSON.parse(jsonMatch[0]);
          
          if (typeof parsedJson.isValid !== 'boolean' ||
              !Array.isArray(parsedJson.redundancyIssues) ||
              !Array.isArray(parsedJson.contextIssues) ||
              !Array.isArray(parsedJson.grammarErrors) ||
              !Array.isArray(parsedJson.suggestions) ||
              typeof parsedJson.overallFeedback !== 'string') {
            throw new Error('Invalid response structure from Gemini');
          }

          return parsedJson;
        } catch (parseError) {
          console.error('Error parsing Gemini response:', parseError);
          throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
        }
      } catch (error) {
        console.error('Error in Gemini analysis:', error);
        throw error;
      }
    });
  }
}