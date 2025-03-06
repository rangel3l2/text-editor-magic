import { createGeminiClient } from "./geminiClient.ts";

class ContentValidator {
  private geminiClient;

  constructor() {
    this.geminiClient = createGeminiClient();
  }

  async validateTitle(title: string, sectionName: string = "Título"): Promise<any> {
    try {
      console.log(`Validando título: ${title}`);
      
      // Se o título for muito curto, retornar erro
      if (title.length < 5) {
        return {
          isValid: false,
          overallFeedback: `O ${sectionName.toLowerCase()} é muito curto. Adicione mais detalhes para uma validação adequada.`,
          details: {
            suggestions: [`Elabore o ${sectionName.toLowerCase()} para ter pelo menos 10 caracteres.`]
          }
        };
      }

      // Prompt para validação do título
      const prompt = `
      Você é um professor universitário especializado em metodologia científica. Analise o título acadêmico a seguir e avalie:

      Título: "${title}"

      Avalie o título quanto a:
      1. Clareza e objetividade
      2. Adequação à linguagem acadêmica
      3. Precisão técnica e terminológica
      4. Informatividade (se comunica bem o tema do trabalho)
      5. Concisão (se não é desnecessariamente longo)
      6. Gramática e ortografia

      Retorne sua análise no seguinte formato JSON:
      {
        "isValid": boolean,
        "overallFeedback": "Feedback geral sobre o título",
        "details": {
          "spellingErrors": ["erro1", "erro2"],
          "coherenceIssues": ["problema1", "problema2"],
          "suggestions": ["sugestão1", "sugestão2"],
          "improvedVersions": ["versão melhorada 1", "versão melhorada 2"]
        }
      }

      Se o título for adequado, defina "isValid" como true e forneça feedback positivo.
      Se o título precisar de melhorias, defina "isValid" como false, liste os problemas e forneça sugestões específicas.
      `;

      const response = await this.geminiClient.generateContent(prompt);
      const responseText = response.response.text();
      
      console.log("Resposta bruta:", responseText);
      
      // Encontrar e extrair o JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Formato de resposta inválido");
      }
      
      const jsonStr = jsonMatch[0];
      const result = JSON.parse(jsonStr);
      
      // Garantir que o formato da resposta esteja correto
      return {
        isValid: result.isValid === true,
        overallFeedback: result.overallFeedback || "Análise concluída",
        details: {
          spellingErrors: Array.isArray(result.details?.spellingErrors) ? result.details.spellingErrors : [],
          coherenceIssues: Array.isArray(result.details?.coherenceIssues) ? result.details.coherenceIssues : [],
          suggestions: Array.isArray(result.details?.suggestions) ? result.details.suggestions : [],
          improvedVersions: Array.isArray(result.details?.improvedVersions) ? 
            result.details.improvedVersions.map((version: any) => {
              // Garantir que não há objetos complexos que causem erros no React
              if (typeof version === 'object') {
                return version.improved || version.original || JSON.stringify(version);
              }
              return version;
            }) : []
        }
      };
    } catch (error) {
      console.error("Erro na validação do título:", error);
      return {
        isValid: false,
        error: `Não foi possível validar o título: ${error.message}`,
        overallFeedback: "Ocorreu um erro durante a validação do título."
      };
    }
  }

  async validateContent(content: string, sectionName: string): Promise<any> {
    try {
      console.log(`Validando conteúdo da seção: ${sectionName}`);
      
      // Se o conteúdo for muito curto, retornar erro
      if (content.length < 10) {
        return {
          isValid: false,
          overallFeedback: `O conteúdo da seção ${sectionName} é muito curto. Adicione mais detalhes para uma validação adequada.`,
          details: {
            suggestions: [`Elabore o conteúdo da seção ${sectionName} para ter pelo menos 50 caracteres.`]
          }
        };
      }

      // Prompt para validação do conteúdo, adaptado conforme a seção
      let prompt = `
      Você é um professor universitário especializado em metodologia científica. 
      Analise o conteúdo da seção "${sectionName}" a seguir e avalie:

      Conteúdo: "${content.substring(0, 5000)}"

      Avalie o conteúdo quanto a:
      1. Clareza e objetividade
      2. Adequação à linguagem acadêmica
      3. Coerência e coesão
      4. Precisão técnica e terminológica
      5. Gramática e ortografia

      Retorne sua análise no seguinte formato JSON:
      {
        "isValid": boolean,
        "overallFeedback": "Feedback geral sobre o conteúdo",
        "details": {
          "spellingErrors": ["erro1", "erro2"],
          "coherenceIssues": ["problema1", "problema2"],
          "suggestions": ["sugestão1", "sugestão2"],
          "improvedVersions": ["versão melhorada 1"]
        }
      }

      Se o conteúdo for adequado para uma seção de ${sectionName}, defina "isValid" como true e forneça feedback positivo.
      Se precisar de melhorias, defina "isValid" como false, liste os problemas e forneça sugestões específicas.
      Seja breve e objetivo em seu feedback, pois ele será exibido em uma interface de usuário compacta.
      `;

      if (sectionName.toLowerCase().includes("introdução completa")) {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise o conteúdo da Introdução a seguir e avalie com rigor seguindo as normas ABNT:

        Introdução: "${content.substring(0, 5000)}"

        Avalie rigorosamente se a introdução:
        1. Contextualiza adequadamente o tema com base em literatura recente
        2. Apresenta claramente a problemática de pesquisa
        3. Indica a relevância e justificativa do estudo
        4. Menciona explicitamente os objetivos do trabalho
        5. Possui coesão e coerência entre os parágrafos
        6. Está livre de pleonasmos e redundâncias
        7. Utiliza linguagem acadêmica formal de acordo com a ABNT
        8. Está gramaticalmente correta
        9. Mantém uma estrutura lógica: do geral para o específico

        Retorne sua análise no seguinte formato JSON:
        {
          "isValid": boolean,
          "overallFeedback": "Feedback detalhado sobre a introdução",
          "details": {
            "spellingErrors": ["erro1", "erro2"],
            "coherenceIssues": ["problema de coesão ou coerência1", "problema2"],
            "abntIssues": ["problema relacionado às normas ABNT1", "problema2"],
            "pleonasms": ["pleonasmo ou redundância encontrada1", "pleonasmo2"],
            "structureIssues": ["problema na estrutura lógica1", "problema2"],
            "suggestions": ["sugestão de melhoria1", "sugestão2"],
            "improvedVersions": ["sugestão para uma versão melhorada"]
          }
        }

        Se a introdução estiver excelente, defina "isValid" como true e forneça feedback positivo.
        Se precisar de melhorias, defina "isValid" como false, liste detalhadamente os problemas categorizados e forneça sugestões específicas para cada problema identificado.
        Seja minucioso na análise, especialmente quanto à coerência entre os parágrafos, uso adequado de conectivos, ausência de pleonasmos, e conformidade com normas ABNT.
        `;
      } else if (sectionName.toLowerCase().includes("introdução") || sectionName.toLowerCase().includes("tema") || sectionName.toLowerCase().includes("problema") || sectionName.toLowerCase().includes("objetivos")) {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise o conteúdo da parte da Introdução (${sectionName}) a seguir e avalie:

        Conteúdo: "${content.substring(0, 5000)}"

        Avalie se este componente da introdução:
        1. Atende ao propósito específico desta seção (tema, problema ou objetivos)
        2. Está redigido com clareza e precisão
        3. Utiliza linguagem acadêmica apropriada
        4. Está livre de erros gramaticais
        5. Está coerente e bem estruturado

        Retorne sua análise no seguinte formato JSON:
        {
          "isValid": boolean,
          "overallFeedback": "Feedback específico sobre esta parte da introdução",
          "details": {
            "spellingErrors": ["erro1", "erro2"],
            "coherenceIssues": ["problema1", "problema2"],
            "suggestions": ["sugestão1", "sugestão2"],
            "improvedVersions": ["sugestão para uma versão melhorada deste componente"]
          }
        }

        Se o conteúdo for adequado para esta parte da introdução, defina "isValid" como true e forneça feedback positivo.
        Se precisar de melhorias, defina "isValid" como false, liste os problemas e forneça sugestões específicas.
        `;
      }
      // Mantenha as outras condições existentes
      else if (sectionName.toLowerCase().includes("metodologia")) {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise o conteúdo da Metodologia a seguir e avalie:

        Metodologia: "${content.substring(0, 5000)}"

        Avalie se a metodologia:
        1. Descreve claramente os procedimentos metodológicos
        2. Especifica o tipo de pesquisa/estudo
        3. Detalha os materiais e métodos utilizados
        4. Explica como os dados foram coletados/analisados
        5. Utiliza terminologia adequada
        6. Está gramaticalmente correta

        Retorne sua análise no seguinte formato JSON:
        {
          "isValid": boolean,
          "overallFeedback": "Feedback geral sobre a metodologia",
          "details": {
            "spellingErrors": ["erro1", "erro2"],
            "coherenceIssues": ["problema1", "problema2"],
            "suggestions": ["sugestão1", "sugestão2"],
            "improvedVersions": ["versão melhorada concisa"]
          }
        }

        Se a metodologia for adequada, defina "isValid" como true e forneça feedback positivo.
        Se precisar de melhorias, defina "isValid" como false, liste os problemas e forneça sugestões específicas.
        `;
      } else if (sectionName.toLowerCase().includes("resultado") || sectionName.toLowerCase().includes("discussão")) {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise o conteúdo da seção de Resultados/Discussão a seguir e avalie:

        Resultados/Discussão: "${content.substring(0, 5000)}"

        Avalie se a seção:
        1. Apresenta claramente os resultados encontrados
        2. Discute os achados em relação à literatura
        3. Interpreta os dados de forma coerente
        4. Aborda limitações (se aplicável)
        5. Utiliza linguagem acadêmica precisa
        6. Está gramaticalmente correta

        Retorne sua análise no seguinte formato JSON:
        {
          "isValid": boolean,
          "overallFeedback": "Feedback geral sobre os resultados/discussão",
          "details": {
            "spellingErrors": ["erro1", "erro2"],
            "coherenceIssues": ["problema1", "problema2"],
            "suggestions": ["sugestão1", "sugestão2"],
            "improvedVersions": ["versão melhorada concisa"]
          }
        }

        Se a seção for adequada, defina "isValid" como true e forneça feedback positivo.
        Se precisar de melhorias, defina "isValid" como false, liste os problemas e forneça sugestões específicas.
        `;
      } else if (sectionName.toLowerCase().includes("conclusão")) {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise o conteúdo da Conclusão a seguir e avalie:

        Conclusão: "${content.substring(0, 5000)}"

        Avalie se a conclusão:
        1. Sintetiza os principais resultados
        2. Retoma o objetivo inicial do trabalho
        3. Apresenta as conclusões/considerações finais
        4. Indica contribuições ou implicações do estudo
        5. Sugere direções para pesquisas futuras (se aplicável)
        6. Está gramaticalmente correta

        Retorne sua análise no seguinte formato JSON:
        {
          "isValid": boolean,
          "overallFeedback": "Feedback geral sobre a conclusão",
          "details": {
            "spellingErrors": ["erro1", "erro2"],
            "coherenceIssues": ["problema1", "problema2"],
            "suggestions": ["sugestão1", "sugestão2"],
            "improvedVersions": ["versão melhorada concisa"]
          }
        }

        Se a conclusão for adequada, defina "isValid" como true e forneça feedback positivo.
        Se precisar de melhorias, defina "isValid" como false, liste os problemas e forneça sugestões específicas.
        `;
      }

      const response = await this.geminiClient.generateContent(prompt);
      const responseText = response.response.text();
      
      console.log("Resposta da validação de conteúdo:", responseText.substring(0, 200) + "...");
      
      // Encontrar e extrair o JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Formato de resposta inválido");
      }
      
      const jsonStr = jsonMatch[0];
      const result = JSON.parse(jsonStr);
      
      // Garantir que o formato da resposta esteja correto e incluir campos específicos da ABNT se existirem
      return {
        isValid: result.isValid === true,
        overallFeedback: result.overallFeedback || `Análise da seção ${sectionName} concluída`,
        details: {
          spellingErrors: Array.isArray(result.details?.spellingErrors) ? result.details.spellingErrors : [],
          coherenceIssues: Array.isArray(result.details?.coherenceIssues) ? result.details.coherenceIssues : [],
          abntIssues: Array.isArray(result.details?.abntIssues) ? result.details.abntIssues : [],
          pleonasms: Array.isArray(result.details?.pleonasms) ? result.details.pleonasms : [],
          structureIssues: Array.isArray(result.details?.structureIssues) ? result.details.structureIssues : [],
          suggestions: Array.isArray(result.details?.suggestions) ? result.details.suggestions : [],
          improvedVersions: Array.isArray(result.details?.improvedVersions) ? 
            result.details.improvedVersions.map((version: any) => {
              // Garantir que não há objetos complexos que causem erros no React
              if (typeof version === 'object') {
                return version.improved || version.original || JSON.stringify(version);
              }
              return version;
            }) : []
        }
      };
    } catch (error) {
      console.error("Erro na validação do conteúdo:", error);
      return {
        isValid: false,
        error: `Não foi possível validar o conteúdo: ${error.message}`,
        overallFeedback: `Ocorreu um erro durante a validação da seção ${sectionName}.`
      };
    }
  }
}

export const contentValidator = new ContentValidator();
