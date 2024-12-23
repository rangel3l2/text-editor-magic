import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

export class GeminiClient {
  private model;
  private maxRetries = 3;
  private baseDelay = 2000; // 2 seconds
  private maxBackoff = 32000; // 32 seconds
  
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
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt >= this.maxRetries || 
          (!error.message?.includes('429') && !error.message?.toLowerCase().includes('rate limit'))) {
        throw error;
      }

      const delayMs = Math.min(
        this.baseDelay * Math.pow(2, attempt),
        this.maxBackoff
      );
      
      console.log(`Retrying after ${delayMs}ms (attempt ${attempt + 1}/${this.maxRetries})`);
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
                1. Clareza e Objetividade
                2. Número de Palavras
                3. Aspectos Técnicos
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

        console.log('Sending request to Gemini...');
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
          
          if (!this.validateResponseStructure(parsedJson)) {
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

  private validateResponseStructure(response: any): boolean {
    return (
      typeof response.isValid === 'boolean' &&
      Array.isArray(response.redundancyIssues) &&
      Array.isArray(response.contextIssues) &&
      Array.isArray(response.grammarErrors) &&
      Array.isArray(response.suggestions) &&
      typeof response.overallFeedback === 'string'
    );
  }
}