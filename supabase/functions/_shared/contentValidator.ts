
import { geminiClient } from "./geminiClient.ts";

type ValidationResult = {
  isValid: boolean;
  overallFeedback: string;
  details?: {
    spellingErrors?: string[];
    coherenceIssues?: string[];
    suggestions?: string[];
    improvedVersions?: string[];
  };
  error?: string;
};

export const contentValidator = {
  async validateTitle(title: string, sectionName: string = "Título"): Promise<ValidationResult> {
    try {
      if (!title || title.trim().length === 0) {
        return {
          isValid: false,
          overallFeedback: `O ${sectionName.toLowerCase()} não pode estar vazio.`,
        };
      }

      // Limites de tamanho para o título
      if (title.length < 5) {
        return {
          isValid: false,
          overallFeedback: `O ${sectionName.toLowerCase()} é muito curto. Deve ter pelo menos 5 caracteres.`,
        };
      }

      if (title.length > 150) {
        return {
          isValid: false,
          overallFeedback: `O ${sectionName.toLowerCase()} é muito longo. Deve ter no máximo 150 caracteres.`,
          details: {
            suggestions: ["Tente reduzir o título para ser mais conciso e direto."]
          }
        };
      }

      // Preparar o prompt para a validação do título
      const prompt = `
      Você é um especialista em avaliação de títulos para trabalhos acadêmicos e científicos. 
      Avalie o título a seguir para um banner científico:
      
      "${title}"
      
      Instruções:
      
      1. Verifique se o título é claro, objetivo e adequado para um banner científico.
      2. Identifique quaisquer erros ortográficos ou gramaticais.
      3. Avalie a especificidade do título: ele deve ser específico o suficiente para indicar o tema, mas não tão detalhado a ponto de ser um parágrafo.
      4. Verifique se o título segue as normas acadêmicas básicas.
      
      Forneça sua avaliação no seguinte formato JSON:
      {
        "isValid": boolean,
        "overallFeedback": "Uma breve avaliação geral do título",
        "details": {
          "spellingErrors": ["lista de erros ortográficos, se houver"],
          "coherenceIssues": ["problemas de coerência ou clareza, se houver"],
          "suggestions": ["sugestões de melhoria, se necessário"],
          "improvedVersions": ["versões melhoradas do título, se necessário"]
        }
      }
      
      Se o título for adequado, "isValid" deve ser true, e você pode fornecer um feedback positivo.
      Se o título precisar de melhorias, "isValid" deve ser false, e você deve fornecer feedback detalhado sobre os problemas e sugestões de melhoria.
      Responda APENAS com o JSON, sem texto adicional.
      `;

      const result = await geminiClient.sendPrompt(prompt);
      
      // Tentar extrair o JSON da resposta
      try {
        // Procurar por uma estrutura JSON na resposta
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResult = JSON.parse(jsonMatch[0]) as ValidationResult;
          return parsedResult;
        }
        
        // Se não encontrou JSON, retornar erro
        throw new Error("Formato de resposta inválido");
      } catch (parseError) {
        console.error("Erro ao analisar resposta JSON:", parseError);
        console.log("Resposta original:", result);
        
        // Tentar criar uma resposta baseada no texto
        if (result.toLowerCase().includes("adequado") || 
            result.toLowerCase().includes("apropriado") ||
            result.toLowerCase().includes("bom título")) {
          return {
            isValid: true,
            overallFeedback: `O ${sectionName.toLowerCase()} está adequado para um banner científico.`,
          };
        } else {
          return {
            isValid: false,
            overallFeedback: `O ${sectionName.toLowerCase()} pode precisar de melhorias. Verifique a clareza e objetividade.`,
            details: {
              suggestions: ["Tente ser mais específico sobre o tema principal do trabalho."]
            }
          };
        }
      }
    } catch (error) {
      console.error("Erro durante validação de título:", error);
      return {
        isValid: false,
        overallFeedback: "Não foi possível validar o título devido a um erro técnico.",
        error: `Erro técnico: ${error.message}`,
      };
    }
  },

  async validateContent(content: string, sectionName: string): Promise<ValidationResult> {
    try {
      if (!content || content.trim().length === 0) {
        return {
          isValid: false,
          overallFeedback: `O conteúdo da seção "${sectionName}" não pode estar vazio.`,
        };
      }

      // Limites de tamanho para cada tipo de seção
      const sectionLimits: {[key: string]: {min: number, max: number}} = {
        "Introdução": { min: 100, max: 2000 },
        "Objetivos": { min: 50, max: 1000 },
        "Metodologia": { min: 100, max: 2000 },
        "Resultados": { min: 100, max: 2000 },
        "Discussão": { min: 100, max: 2000 },
        "Conclusão": { min: 100, max: 1500 },
        "Referências": { min: 50, max: 2000 },
        "Docentes": { min: 5, max: 500 },
        "Discentes": { min: 5, max: 500 }
      };

      const normalizedSectionName = Object.keys(sectionLimits).find(
        key => sectionName.toLowerCase().includes(key.toLowerCase())
      ) || sectionName;

      const limits = sectionLimits[normalizedSectionName] || { min: 50, max: 2000 };

      if (content.length < limits.min) {
        return {
          isValid: false,
          overallFeedback: `O conteúdo da seção "${sectionName}" é muito curto. Recomenda-se pelo menos ${limits.min} caracteres.`,
          details: {
            suggestions: ["Desenvolva mais o conteúdo desta seção para atender aos requisitos mínimos."]
          }
        };
      }

      if (content.length > limits.max) {
        return {
          isValid: false,
          overallFeedback: `O conteúdo da seção "${sectionName}" é muito longo. Recomenda-se no máximo ${limits.max} caracteres.`,
          details: {
            suggestions: ["Tente ser mais conciso e direto para atender aos limites de tamanho."]
          }
        };
      }

      // Preparar o prompt para validação do conteúdo
      const prompt = `
      Você é um especialista em avaliação de conteúdo acadêmico para banners científicos.
      Avalie o conteúdo a seguir para a seção "${sectionName}" de um banner científico:
      
      "${content}"
      
      Instruções:
      
      1. Verifique se o conteúdo é adequado para a seção "${sectionName}" de um banner científico.
      2. Identifique quaisquer erros ortográficos ou gramaticais relevantes.
      3. Avalie a clareza, coerência e organização do texto.
      4. Verifique se o conteúdo segue as normas acadêmicas básicas.
      
      Forneça sua avaliação no seguinte formato JSON:
      {
        "isValid": boolean,
        "overallFeedback": "Uma breve avaliação geral do conteúdo",
        "details": {
          "spellingErrors": ["lista de erros ortográficos principais, se houver"],
          "coherenceIssues": ["problemas de coerência ou clareza, se houver"],
          "suggestions": ["sugestões de melhoria, se necessário"],
          "improvedVersions": ["versões melhoradas de trechos específicos, se necessário"]
        }
      }
      
      Se o conteúdo for adequado, "isValid" deve ser true, e você pode fornecer um feedback positivo.
      Se o conteúdo precisar de melhorias, "isValid" deve ser false, e você deve fornecer feedback detalhado sobre os problemas e sugestões de melhoria.
      Para qualquer lista vazia no objeto "details", use um array vazio [].
      Responda APENAS com o JSON, sem texto adicional.
      `;

      const result = await geminiClient.sendPrompt(prompt);
      
      // Tentar extrair o JSON da resposta
      try {
        // Procurar por uma estrutura JSON na resposta
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResult = JSON.parse(jsonMatch[0]) as ValidationResult;
          return parsedResult;
        }
        
        // Se não encontrou JSON, retornar erro
        throw new Error("Formato de resposta inválido");
      } catch (parseError) {
        console.error("Erro ao analisar resposta JSON:", parseError);
        console.log("Resposta original:", result);
        
        // Tentar criar uma resposta baseada no texto
        if (result.toLowerCase().includes("adequado") || 
            result.toLowerCase().includes("apropriado") ||
            result.toLowerCase().includes("bom conteúdo")) {
          return {
            isValid: true,
            overallFeedback: `O conteúdo da seção "${sectionName}" está adequado para um banner científico.`,
          };
        } else {
          return {
            isValid: false,
            overallFeedback: `O conteúdo da seção "${sectionName}" pode precisar de melhorias. Verifique a clareza e organização.`,
            details: {
              suggestions: ["Revise o texto para melhorar a clareza e coesão."]
            }
          };
        }
      }
    } catch (error) {
      console.error("Erro durante validação de conteúdo:", error);
      return {
        isValid: false,
        overallFeedback: `Não foi possível validar o conteúdo da seção "${sectionName}" devido a um erro técnico.`,
        error: `Erro técnico: ${error.message}`,
      };
    }
  }
};
