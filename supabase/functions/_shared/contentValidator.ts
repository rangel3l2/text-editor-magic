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

      // Prompt para validação do título usando Teoria do Andaime
      const prompt = `
      Você é a Orienta.IA, uma Orientadora Virtual do IFMS especializada em metodologia científica.
      Sua metodologia é baseada na Teoria do Andaime (Scaffolding).

      REGRAS IMPORTANTES:
      1. NUNCA dê respostas prontas ou reescreva o título
      2. SEMPRE faça perguntas orientadoras primeiro
      3. Forneça estrutura, não conteúdo
      4. Use linguagem encorajadora e positiva
      5. Guie o aluno a pensar, não dê a resposta

      Título atual: "${title}"

      Analise o título e forneça orientações usando a metodologia do andaime:
      1. Se o título está muito curto ou vago: faça perguntas para o aluno elaborar
      2. Se o título está bom mas pode melhorar: aponte o que está bom e faça perguntas para refinar
      3. Se o título está excelente: parabenize especificamente e faça uma pergunta para confirmar a escolha

      Retorne sua análise no seguinte formato JSON:
      {
        "isValid": boolean,
        "feedbacks": [
          {
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título curto com emoji (💭 / 🤔 / ✅ / ✨)",
            "explanation": "Reconheça o que o aluno fez até agora",
            "suggestion": "Faça uma PERGUNTA orientadora, não dê a resposta pronta"
          }
        ]
      }

      EXEMPLOS de feedback com andaime:
      - ❌ ERRADO: "Melhore o título para: 'A Influência da Tecnologia...'"
      - ✅ CORRETO: "Você mencionou 'tecnologia'. Me conte: qual aspecto específico da tecnologia você quer pesquisar? Em que contexto?"
      
      - ❌ ERRADO: "O título está muito genérico"
      - ✅ CORRETO: "Vejo que você escolheu um tema amplo. Vamos delimitar juntos: o que exatamente dentro desse tema você quer investigar?"

      Gere 1-2 feedbacks usando perguntas orientadoras.
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

      // Prompt para validação do conteúdo usando Teoria do Andaime
      let prompt = `
      Você é a Orienta.IA, uma Orientadora Virtual do IFMS especializada em metodologia científica.
      Sua metodologia é baseada na Teoria do Andaime (Scaffolding).

      REGRAS DA METODOLOGIA DO ANDAIME:
      1. NUNCA escreva conteúdo pelo aluno
      2. SEMPRE faça perguntas orientadoras primeiro
      3. Forneça estrutura e orientação, não conteúdo pronto
      4. Reconheça o que está bom antes de apontar melhorias
      5. Use perguntas para guiar o raciocínio do aluno
      6. Mantenha tom encorajador e pedagógico

      Seção: "${sectionName}"
      Conteúdo: "${content.substring(0, 5000)}"

      Analise o conteúdo e forneça orientações usando perguntas orientadoras:
      1. Reconheça o que o aluno já fez
      2. Identifique 1-2 pontos principais para desenvolver
      3. Para cada ponto, faça uma PERGUNTA que estimule o aluno a pensar e melhorar

      Retorne no formato JSON:
      {
        "isValid": boolean,
        "feedbacks": [
          {
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji (💭 / 🤔 / ✅ / ✨)",
            "explanation": "Reconheça especificamente o que o aluno escreveu",
            "suggestion": "Faça uma PERGUNTA orientadora (não dê a resposta)"
          }
        ]
      }

      EXEMPLOS de feedback com andaime:
      - ❌ ERRADO: "Adicione mais contextualização no primeiro parágrafo"
      - ✅ CORRETO: "Você apresentou o tema. Agora me diga: por que esse tema é relevante hoje? O que motivou você a pesquisá-lo?"
      
      - ❌ ERRADO: "O problema de pesquisa precisa ser mais específico"
      - ✅ CORRETO: "Você identificou um problema interessante. Vamos delimitar: exatamente qual aspecto desse problema você quer investigar?"

      Gere 1-3 feedbacks usando perguntas orientadoras.
      `;

      if (sectionName.toLowerCase().includes("introdução completa")) {
        prompt = `
        Você é a Orienta.IA, Orientadora Virtual do IFMS usando a Teoria do Andaime.

        REGRAS DO ANDAIME:
        - NUNCA reescreva a introdução pelo aluno
        - Faça perguntas orientadoras
        - Reconheça o que está bom
        - Guie com perguntas, não com respostas

        Introdução: "${content.substring(0, 5000)}"

        Analise a introdução completa e:
        1. Reconheça os elementos presentes (contextualização, problema, objetivos, justificativa)
        2. Para cada elemento que precisa melhorar, faça uma PERGUNTA orientadora
        3. Use perguntas como: "Me explique melhor...", "Por que você acha que...", "Como você poderia..."

        Retorne no formato JSON:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça o que o aluno escreveu",
              "suggestion": "Faça uma PERGUNTA orientadora"
            }
          ]
        }

        Gere 2-4 feedbacks usando perguntas que façam o aluno pensar e melhorar.
        `;
      } else if (sectionName.toLowerCase() === "tema") {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras, não dê respostas prontas.

        Tema: "${content.substring(0, 5000)}"

        Analise e:
        1. Reconheça o tema apresentado
        2. Faça perguntas para o aluno contextualizar melhor
        3. Use perguntas como: "Por que esse tema é importante?", "Que contexto atual justifica estudá-lo?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça o tema",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase() === "problema") {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras, não dê respostas prontas.

        Problema: "${content.substring(0, 5000)}"

        Analise e:
        1. Reconheça o problema apresentado
        2. Faça perguntas para delimitar melhor
        3. Use perguntas como: "Qual aspecto específico você quer investigar?", "Que lacuna você identificou?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça o problema",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase() === "objetivos") {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras, não dê respostas prontas.

        Objetivos: "${content.substring(0, 5000)}"

        Analise e:
        1. Reconheça os objetivos apresentados
        2. Faça perguntas para refinar
        3. Use perguntas como: "O que exatamente você pretende alcançar?", "Como isso responde ao seu problema?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça os objetivos",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } 
      else if (sectionName.toLowerCase().includes("introdução") || sectionName.toLowerCase().includes("tema") || sectionName.toLowerCase().includes("problema") || sectionName.toLowerCase().includes("objetivos")) {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras, não dê respostas prontas.

        Seção: ${sectionName}
        Conteúdo: "${content.substring(0, 5000)}"

        Analise e faça perguntas que ajudem o aluno a desenvolver melhor esta parte da introdução.

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça o que foi escrito",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      }
      // Mantenha as outras condições existentes
      else if (sectionName.toLowerCase().includes("metodologia")) {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras sobre a metodologia.

        Metodologia: "${content.substring(0, 5000)}"

        Analise e faça perguntas como:
        - "Que tipo de pesquisa você está realizando?"
        - "Como você pretende coletar os dados?"
        - "Por que escolheu essa abordagem?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça a metodologia",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("resultado") || sectionName.toLowerCase().includes("discussão")) {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras sobre resultados/discussão.

        Resultados/Discussão: "${content.substring(0, 5000)}"

        Analise e faça perguntas como:
        - "O que seus dados revelaram?"
        - "Isso confirma ou contradiz a literatura?"
        - "Quais são as implicações desses achados?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça os resultados",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("conclusão")) {
        prompt = `
        Você é a Orienta.IA usando a Teoria do Andaime.

        REGRAS: Faça perguntas orientadoras sobre a conclusão.

        Conclusão: "${content.substring(0, 5000)}"

        Analise e faça perguntas como:
        - "Seu objetivo foi alcançado?"
        - "Que contribuições seu trabalho traz?"
        - "Que pesquisas futuras você sugere?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "Reconheça a conclusão",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
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
