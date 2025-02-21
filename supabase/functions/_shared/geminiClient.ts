import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

export class GeminiClient {
  private model;
  private maxRetries = 3;
  private baseDelay = 2000; // 2 seconds
  private maxBackoff = 32000; // 32 seconds
  private requestsTimestamp: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1 minute window
  private readonly maxRequestsPerWindow = 10; // Max requests per minute
  
  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRateLimited(section: string): boolean {
    const now = Date.now();
    const timestamps = this.requestsTimestamp.get(section) || [];
    
    // Clean up old timestamps
    const recentTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    this.requestsTimestamp.set(section, recentTimestamps);
    
    // Apply stricter limits for Results section
    const maxRequests = section.toLowerCase().includes('resultados') ? 
      Math.floor(this.maxRequestsPerWindow / 2) : 
      this.maxRequestsPerWindow;
    
    return recentTimestamps.length >= maxRequests;
  }

  private recordRequest(section: string): void {
    const timestamps = this.requestsTimestamp.get(section) || [];
    timestamps.push(Date.now());
    this.requestsTimestamp.set(section, timestamps);
  }

  private buildPrompt(content: string, prompts: { type: string, section?: string }[]): string {
    let combinedPrompt = "";
    
    prompts.forEach((prompt, index) => {
      switch (prompt.type) {
        case "title":
          combinedPrompt += `
            Analise o título do banner acadêmico:
            "${content}"
            
            Critérios de análise:
            1. Clareza e Objetividade
            2. Número de Palavras
            3. Aspectos Técnicos
          `;
          break;
        case "content":
          combinedPrompt += `
            Analise o texto para a seção "${prompt.section}" do banner acadêmico:
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

    combinedPrompt += `\n\nIMPORTANTE: Sua resposta DEVE ser um objeto JSON válido com esta estrutura:
    {
      "isValid": boolean,
      "contextIssues": string[],
      "suggestions": string[],
      "overallFeedback": string
    }
    
    Certifique-se de que a resposta seja um JSON válido e bem formatado.`;

    return combinedPrompt;
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    section: string,
    attempt: number = 0
  ): Promise<T> {
    try {
      if (this.isRateLimited(section)) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      this.recordRequest(section);
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt >= this.maxRetries || 
          (!error.message?.includes('429') && 
           !error.message?.includes('RATE_LIMIT') && 
           !error.message?.toLowerCase().includes('quota'))) {
        throw error;
      }

      const delayMs = Math.min(
        this.baseDelay * Math.pow(2, attempt),
        this.maxBackoff
      );
      
      console.log(`Retrying after ${delayMs}ms (attempt ${attempt + 1}/${this.maxRetries})`);
      await this.delay(delayMs);
      
      return this.retryWithExponentialBackoff(operation, section, attempt + 1);
    }
  }

  async analyzeContent(content: string, prompts: { type: string, section?: string }[]): Promise<any> {
    const section = prompts[0]?.section || 'default';
    
    return this.retryWithExponentialBackoff(async () => {
      try {
        const prompt = this.buildPrompt(content, prompts);
        console.log('Sending request to Gemini with prompt:', prompt);
        
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        console.log('Raw Gemini response:', text);
        
        // Try to find and parse JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in Gemini response');
        }

        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Error parsing Gemini response:', parseError);
          throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
        }
      } catch (error) {
        console.error('Error in Gemini analysis:', error);
        throw error;
      }
    }, section);
  }
}