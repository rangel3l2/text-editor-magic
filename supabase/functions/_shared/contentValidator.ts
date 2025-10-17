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
          feedbacks: [{
            id: `short-${Date.now()}`,
            type: 'warning',
            title: '⚠️ Título muito curto',
            explanation: `O ${sectionName.toLowerCase()} precisa ser mais descritivo.`,
            suggestion: `Elabore o ${sectionName.toLowerCase()} para ter pelo menos 10 caracteres.`
          }]
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

      Retorne sua análise no seguinte formato JSON com um array de feedbacks estruturados:
      {
        "isValid": boolean,
        "feedbacks": [
          {
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título curto (1 linha)",
            "explanation": "Explicação breve (1-2 linhas)",
            "suggestion": "Sugestão prática (1 linha)"
          }
        ]
      }

      Tipos de feedback:
      - "excellent": Quando o título está impecável
      - "success": Quando está bom mas tem pequenos detalhes a melhorar
      - "tip": Orientações para melhorar
      - "warning": Problemas que precisam atenção

      Gere 1-3 feedbacks específicos. Cada um deve seguir:
      - Emoji no título (💡 Dica / ⚠️ Atenção / ✅ Muito bem / ✨ Excelente)
      - Título direto e motivador
      - Explicação clara do ponto
      - Sugestão prática e aplicável
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
        feedbacks: Array.isArray(result.feedbacks) ? result.feedbacks.map((fb: any) => ({
          id: `${Date.now()}-${Math.random()}`,
          type: fb.type || 'tip',
          title: fb.title || 'Feedback',
          explanation: fb.explanation || '',
          suggestion: fb.suggestion || ''
        })) : []
      };
    } catch (error) {
      console.error("Erro na validação do título:", error);
      return {
        isValid: false,
        feedbacks: [{
          id: `error-${Date.now()}`,
          type: 'warning',
          title: '⚠️ Erro na validação',
          explanation: `Não foi possível validar o título.`,
          suggestion: 'Tente novamente mais tarde ou continue editando normalmente.'
        }]
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
          feedbacks: [{
            id: `short-${Date.now()}`,
            type: 'warning',
            title: '⚠️ Conteúdo muito curto',
            explanation: `O conteúdo da seção ${sectionName} precisa ser mais desenvolvido.`,
            suggestion: `Elabore o conteúdo da seção ${sectionName} para ter pelo menos 50 caracteres.`
          }]
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

      Retorne sua análise no seguinte formato JSON com um array de feedbacks estruturados:
      {
        "isValid": boolean,
        "feedbacks": [
          {
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título curto (1 linha)",
            "explanation": "Explicação breve (1-2 linhas)",
            "suggestion": "Sugestão prática (1 linha)"
          }
        ]
      }

      Tipos de feedback:
      - "excellent": Quando está impecável
      - "success": Quando está bom mas tem pequenos detalhes a melhorar
      - "tip": Orientações para melhorar
      - "warning": Problemas que precisam atenção

      Gere 1-4 feedbacks específicos. Cada um deve seguir:
      - Emoji no título (💡 / ⚠️ / ✅ / ✨)
      - Título direto e motivador
      - Explicação clara do ponto
      - Sugestão prática e aplicável
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

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 2-5 feedbacks categorizados (estrutura, coerência, ABNT, linguagem, etc).
        Use: "excellent" para pontos impecáveis, "success" para bons com melhorias menores, "tip" para orientações, "warning" para problemas críticos.
        `;
      } else if (sectionName.toLowerCase() === "tema") {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise este parágrafo de apresentação do tema de um trabalho acadêmico:

        Tema: "${content.substring(0, 5000)}"

        Avalie se este componente da introdução:
        1. Contextualiza adequadamente o tema da pesquisa
        2. Apresenta informações atualizadas da literatura
        3. Situa o leitor no contexto geral do assunto
        4. Utiliza linguagem acadêmica apropriada
        5. Está livre de erros gramaticais e pleonasmos
        6. Segue as normas da ABNT

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos sobre a apresentação do tema.
        `;
      } else if (sectionName.toLowerCase() === "problema") {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise este parágrafo de delimitação do problema (problematização) de um trabalho acadêmico:

        Problema: "${content.substring(0, 5000)}"

        Avalie se este componente da introdução:
        1. Identifica claramente a lacuna no conhecimento atual
        2. Apresenta a questão específica que o estudo busca responder
        3. Afunila o tema para o problema específico que será estudado
        4. Utiliza linguagem acadêmica apropriada
        5. Está livre de erros gramaticais e pleonasmos
        6. Segue as normas da ABNT

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos sobre a delimitação do problema.
        `;
      } else if (sectionName.toLowerCase() === "objetivos") {
        prompt = `
        Você é um professor universitário especializado em metodologia científica. 
        Analise este parágrafo de objetivos e justificativas de um trabalho acadêmico:

        Objetivos: "${content.substring(0, 5000)}"

        Avalie se este componente da introdução:
        1. Apresenta claramente os objetivos do trabalho (geral e específicos)
        2. Indica como a pesquisa pretende preencher a lacuna identificada
        3. Explica a relevância e importância do estudo
        4. Destaca as contribuições esperadas para a área de conhecimento
        5. Utiliza linguagem acadêmica apropriada
        6. Está livre de erros gramaticais e pleonasmos
        7. Segue as normas da ABNT

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos sobre objetivos e justificativas.
        `;
      } 
      else if (sectionName.toLowerCase().includes("introdução") || sectionName.toLowerCase().includes("tema") || sectionName.toLowerCase().includes("problema") || sectionName.toLowerCase().includes("objetivos")) {
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

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos para esta parte da introdução.
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

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos sobre a metodologia.
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

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos sobre resultados/discussão.
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

        Retorne sua análise no seguinte formato JSON com feedbacks estruturados:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título curto com emoji",
              "explanation": "Explicação breve (1-2 linhas)",
              "suggestion": "Sugestão prática (1 linha)"
            }
          ]
        }

        Gere 1-3 feedbacks específicos sobre a conclusão.
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
      
      // Garantir que o formato da resposta esteja correto com feedbacks estruturados
      return {
        isValid: result.isValid === true,
        feedbacks: Array.isArray(result.feedbacks) ? result.feedbacks.map((fb: any) => ({
          id: `${Date.now()}-${Math.random()}`,
          type: fb.type || 'tip',
          title: fb.title || 'Feedback',
          explanation: fb.explanation || '',
          suggestion: fb.suggestion || ''
        })) : []
      };
    } catch (error) {
      console.error("Erro na validação do conteúdo:", error);
      return {
        isValid: false,
        feedbacks: [{
          id: `error-${Date.now()}`,
          type: 'warning',
          title: '⚠️ Erro na validação',
          explanation: `Não foi possível validar o conteúdo da seção ${sectionName}.`,
          suggestion: 'Tente novamente mais tarde ou continue editando normalmente.'
        }]
      };
    }
  }
}

export const contentValidator = new ContentValidator();
