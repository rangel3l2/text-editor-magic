
declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: { model: string }): GenerativeModel;
  }

  export interface GenerativeModel {
    generateContent(prompt: string | Array<any>): Promise<GenerateContentResult>;
    startChat(params?: any): ChatSession;
  }

  export interface ChatSession {
    sendMessage(message: string | Array<any>): Promise<GenerateContentResult>;
    getHistory(): Array<any>;
  }

  export interface GenerateContentResult {
    response: {
      text(): string;
    };
  }
}
