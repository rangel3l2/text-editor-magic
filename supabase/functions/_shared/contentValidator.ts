import { createGeminiClient } from "./geminiClient.ts";

class ContentValidator {
  private geminiClient;

  constructor() {
    this.geminiClient = createGeminiClient();
  }

  async validateTitle(title: string, sectionName: string = "Título"): Promise<any> {
    try {
      console.log(`Validando título: ${title}`);
      
      // Se o título for muito curto, retornar erro com metodologia Scaffolding
      if (title.length < 5) {
        return {
          isValid: false,
          feedbacks: [{
            id: `short-${Date.now()}`,
            type: 'warning',
            title: '💭 Vamos começar juntos!',
            explanation: `Usando a Teoria do Andaime, vejo que você está começando a escrever o ${sectionName.toLowerCase()}. Ótimo! Estou aqui para orientar você através de perguntas.`,
            suggestion: `Me conte: sobre qual tema você quer pesquisar? O que mais te interessa nesse assunto?`
          }]
        };
      }

      // Prompt para validação do título usando Teoria do Andaime
      const prompt = `
      Você é a Orienta.IA, uma Orientadora Virtual do IFMS especializada em metodologia científica.
      Sua metodologia é baseada na TEORIA DO ANDAIME (SCAFFOLDING) de Vygotsky e Bruner.

      IMPORTANTE: Em TODA resposta, INICIE o campo "explanation" mencionando explicitamente que você está usando a Teoria do Andaime.

      REGRAS DA METODOLOGIA SCAFFOLDING:
      1. NUNCA dê respostas prontas ou reescreva o título
      2. SEMPRE faça perguntas orientadoras primeiro
      3. Forneça estrutura, não conteúdo
      4. Use linguagem encorajadora e positiva
      5. Guie o aluno a pensar, não dê a resposta
      6. SEMPRE mencione que está usando a Teoria do Andaime

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
            "explanation": "INICIE com 'Usando a Teoria do Andaime...' e depois reconheça o que o aluno fez",
            "suggestion": "Faça uma PERGUNTA orientadora, não dê a resposta pronta"
          }
        ]
      }

      EXEMPLOS de feedback com andaime:
      - ❌ ERRADO: "Melhore o título para: 'A Influência da Tecnologia...'"
      - ✅ CORRETO: "Usando a Teoria do Andaime, vejo que você mencionou 'tecnologia'. Me conte: qual aspecto específico da tecnologia você quer pesquisar? Em que contexto?"
      
      - ❌ ERRADO: "O título está muito genérico"
      - ✅ CORRETO: "Usando a Teoria do Andaime para orientar você: vejo que escolheu um tema amplo. Vamos delimitar juntos: o que exatamente dentro desse tema você quer investigar?"

      Gere 1-2 feedbacks usando perguntas orientadoras e SEMPRE mencionando a metodologia no início do explanation.
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
      
      // Se o conteúdo for muito curto, retornar erro com metodologia Scaffolding
      if (content.length < 10) {
        return {
          isValid: false,
          feedbacks: [{
            id: `short-${Date.now()}`,
            type: 'warning',
            title: '💭 Vamos construir juntos!',
            explanation: `Usando a Teoria do Andaime, vejo que você está começando a seção ${sectionName}. Ótimo início!`,
            suggestion: `Me conte: o que você já sabe sobre essa parte do artigo? Vamos desenvolver juntos através de perguntas orientadoras.`
          }]
        };
      }

      // Prompt base usando Teoria do Andaime
      let prompt = `
      Você é a Orienta.IA, uma Orientadora Virtual do IFMS especializada em metodologia científica.
      Sua metodologia é baseada na TEORIA DO ANDAIME (SCAFFOLDING) de Vygotsky e Bruner.

      IMPORTANTE: Em TODA resposta, INICIE o campo "explanation" mencionando explicitamente que você está usando a Teoria do Andaime.

      REGRAS DA METODOLOGIA SCAFFOLDING:
      1. NUNCA escreva conteúdo pelo aluno
      2. SEMPRE faça perguntas orientadoras primeiro
      3. Forneça estrutura e orientação, não conteúdo pronto
      4. Reconheça o que está bom antes de apontar melhorias
      5. Use perguntas para guiar o raciocínio do aluno
      6. Mantenha tom encorajador e pedagógico
      7. SEMPRE mencione que está usando a Teoria do Andaime

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
            "explanation": "INICIE com 'Usando a Teoria do Andaime...' e depois reconheça especificamente o que o aluno escreveu",
            "suggestion": "Faça uma PERGUNTA orientadora (não dê a resposta)"
          }
        ]
      }

      EXEMPLOS de feedback com andaime:
      - ❌ ERRADO: "Adicione mais contextualização no primeiro parágrafo"
      - ✅ CORRETO: "Usando a Teoria do Andaime, vejo que você apresentou o tema. Agora me diga: por que esse tema é relevante hoje? O que motivou você a pesquisá-lo?"
      
      - ❌ ERRADO: "O problema de pesquisa precisa ser mais específico"
      - ✅ CORRETO: "Usando a Teoria do Andaime para orientar: você identificou um problema interessante. Vamos delimitar: exatamente qual aspecto desse problema você quer investigar?"

      Gere 1-3 feedbacks usando perguntas orientadoras e SEMPRE mencionando a metodologia no início do explanation.
      `;

      // Prompts específicos para cada seção do TCC IFMS
      if (sectionName.toLowerCase().includes("resumo") || sectionName.toLowerCase().includes("abstract")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: RETORNE APENAS O JSON ABAIXO. NÃO ADICIONE TEXTO EXPLICATIVO ANTES OU DEPOIS DO JSON.**

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Resumo/Abstract: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: O resumo deve ser escrito POR ÚLTIMO, após o trabalho estar pronto.
        
        **ATENÇÃO: A contagem é de PALAVRAS, não caracteres!**
        - Mínimo: 100 PALAVRAS
        - Máximo: 250 PALAVRAS
        - Conte as palavras separadas por espaço (ex: "Este artigo apresenta" = 3 palavras)
        
        Estrutura ABNT 6028: Contextualização, Objetivo, Metodologia, Resultados, Conclusão.

        Analise e faça perguntas como:
        - "Qual o objetivo principal do seu trabalho?"
        - "Qual foi sua metodologia?"
        - "Quais seus principais resultados?"
        - "Qual sua conclusão?"

        Se o resumo tiver entre 100-250 PALAVRAS e cobrir todos os elementos, considere válido.

        Retorne APENAS este JSON (sem texto adicional):
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("palavras-chave") || sectionName.toLowerCase().includes("keywords")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: RETORNE APENAS O JSON ABAIXO. NÃO ADICIONE TEXTO EXPLICATIVO ANTES OU DEPOIS DO JSON.**

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Palavras-chave/Keywords: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: Devem ser 3-5 termos que representem a pesquisa (não muito genéricos).

        Analise as palavras-chave e faça perguntas como:
        - "Se você fosse pesquisar seu próprio artigo em uma base de dados, quais termos você usaria?"
        - "Esses termos são específicos suficiente para sua pesquisa?"
        - "As palavras-chave refletem os principais conceitos do seu trabalho?"

        Se houver 3-5 termos relevantes e específicos, considere válido.

        Retorne APENAS este JSON (sem texto adicional):
        {
          "isValid": true ou false,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("fundamentação") || sectionName.toLowerCase().includes("referencial teórico")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Fundamentação Teórica: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: Deve apresentar autores relevantes, evitar plágio, e usar citações ABNT corretas (diretas, indiretas, apud).

        Analise e faça perguntas como:
        - "Quais autores fundamentam sua pesquisa?"
        - "Como você está usando as citações deles?"
        - "Está formatando corretamente segundo a ABNT?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras e mencionando a metodologia.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("referências")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: RETORNE APENAS O JSON ABAIXO. NÃO ADICIONE TEXTO EXPLICATIVO ANTES OU DEPOIS DO JSON.**

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Referências: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: As referências devem seguir ABNT NBR 6023 (alinhadas à esquerda, espaçamento simples).
        Todas as citações no texto devem estar aqui, e vice-versa.

        Analise e faça perguntas como:
        - "Você tem certeza que todos os autores citados no texto estão listados aqui?"
        - "A formatação está seguindo a ABNT?"

        Retorne APENAS este JSON (sem texto adicional):
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("introdução")) {
        prompt = `
        Você é a Orienta.IA, Orientadora Virtual do IFMS usando a TEORIA DO ANDAIME (SCAFFOLDING).

        IMPORTANTE: SEMPRE inicie o campo "explanation" mencionando que está usando a Teoria do Andaime.

        Introdução: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: A Introdução deve apresentar o tema, justificar sua relevância, 
        apresentar o problema de pesquisa e os objetivos. É o primeiro contato do leitor com o trabalho.

        Analise a introdução e:
        1. INICIE o explanation com "Usando a Teoria do Andaime..."
        2. Reconheça especificamente o que o aluno já escreveu
        3. Faça PERGUNTAS orientadoras para aprofundar cada elemento

        Perguntas orientadoras sugeridas:
        - "Você apresentou o tema da pesquisa? Como você contextualiza esse tema?"
        - "Por que esse tema é importante ou relevante hoje?"
        - "Qual é o problema específico que você quer investigar?"
        - "Quais são seus objetivos com essa pesquisa?"

        Retorne no formato JSON com feedbacks usando perguntas orientadoras e sempre mencionando a metodologia:
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji (💭 / 🤔 / ✅ / ✨)",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...' e depois reconheça o que foi escrito",
              "suggestion": "Faça uma PERGUNTA orientadora específica (não dê resposta pronta)"
            }
          ]
        }

        EXEMPLOS de feedback com andaime para Introdução:
        - ❌ ERRADO: "A introdução precisa ter mais contextualização"
        - ✅ CORRETO: "Usando a Teoria do Andaime, vejo que você apresentou o tema. Agora me conte: por que esse tema é importante no contexto atual? O que motivou você a estudá-lo?"
        
        - ❌ ERRADO: "Falta apresentar o problema de pesquisa"
        - ✅ CORRETO: "Usando a Teoria do Andaime para orientar: você descreveu o contexto. Agora vamos delimitar: qual problema específico dentro desse contexto você quer investigar?"

        Gere 1-3 feedbacks focados e específicos usando perguntas orientadoras.
        `;
      } else if (sectionName.toLowerCase() === "tema") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Tema: "${content.substring(0, 5000)}"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras e mencionando a metodologia.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase() === "problema") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Problema: "${content.substring(0, 5000)}"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras e mencionando a metodologia.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase() === "objetivos") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: RETORNE APENAS O JSON ABAIXO. NÃO ADICIONE TEXTO EXPLICATIVO ANTES OU DEPOIS DO JSON.**

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Objetivos: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: Os objetivos devem ser claros, mensuráveis e alcançáveis. 
        O objetivo geral indica o propósito principal da pesquisa.
        Os objetivos específicos são desdobramentos que detalham como o objetivo geral será alcançado.

        Analise e faça perguntas como:
        - "O objetivo geral está claro e alinhado com seu problema de pesquisa?"
        - "Os objetivos específicos são mensuráveis?"
        - "Eles realmente contribuem para alcançar o objetivo geral?"

        Retorne APENAS este JSON (sem texto adicional):
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("metodologia")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: RETORNE APENAS O JSON ABAIXO. NÃO ADICIONE TEXTO EXPLICATIVO ANTES OU DEPOIS DO JSON.**

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Metodologia: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: Deve descrever "como se fez" a pesquisa. Não confundir metodologia de pesquisa 
        (ex: Estudo de Caso, Pesquisa-Ação) com ferramentas técnicas (ex: React, Supabase).
        Pode ter subseções: Arquitetura do Sistema, Procedimentos de Validação.

        Analise e faça perguntas como:
        - "Que tipo de pesquisa você está realizando? (Pesquisa-Ação, Estudo de Caso, etc.)"
        - "Como você pretende coletar os dados?"
        - "Por que escolheu essa abordagem metodológica?"

        Retorne APENAS este JSON (sem texto adicional):
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("resultado") || sectionName.toLowerCase().includes("discussão")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Resultados/Discussão: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: Não se limite a descrever os dados. Faça a DISCUSSÃO conectando 
        resultados com os autores da Fundamentação Teórica. 
        Use formatos ABNT (Quadro, Tabela, Gráfico) para apresentar dados.

        Analise e faça perguntas como:
        - "O que seus dados revelaram?"
        - "Isso confirma ou contradiz o que o Autor X (da sua Fundamentação) disse?"
        - "Quais são as implicações práticas desses achados?"
        - "Como você poderia apresentar esses dados visualmente (tabela, gráfico)?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras e mencionando a metodologia.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      } else if (sectionName.toLowerCase().includes("conclusão") || sectionName.toLowerCase().includes("considerações finais")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        IMPORTANTE: SEMPRE mencione a metodologia no início do explanation.

        Conclusão/Considerações Finais: "${content.substring(0, 5000)}"

        CONTEXTO IFMS: Não apenas repetir o Resumo ou Introdução. 
        Deve retomar os objetivos da Introdução e avaliar se foram alcançados.

        Analise e faça perguntas como:
        - "Seu trabalho conseguiu responder ao Objetivo 1? E ao Objetivo 2?"
        - "Quais foram as limitações da sua pesquisa?"
        - "O que você sugere para trabalhos futuros?"
        - "Quais as contribuições práticas do seu trabalho?"

        Retorne no formato JSON com feedbacks usando PERGUNTAS orientadoras e mencionando a metodologia.
        {
          "isValid": boolean,
          "feedbacks": [
            {
              "type": "success" | "tip" | "warning" | "excellent",
              "title": "Título com emoji",
              "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
              "suggestion": "Pergunta orientadora"
            }
          ]
        }
        `;
      }

      const response = await this.geminiClient.generateContent(prompt);
      const responseText = response.response.text();
      
      console.log("Resposta da validação de conteúdo:", responseText.substring(0, 200) + "...");
      
      // Tentar extrair JSON de diferentes formatos:
      // 1. JSON dentro de blocos ```json
      let jsonStr = '';
      const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1].trim();
      } else {
        // 2. JSON puro (sem blocos de código)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      if (!jsonStr) {
        console.error("Resposta completa do Gemini:", responseText);
        throw new Error("Formato de resposta inválido - nenhum JSON encontrado na resposta");
      }
      
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

      const err = error as (Error & { status?: number; retryDelaySeconds?: number | null; raw?: string });
      const isRateLimited = err?.status === 429;
      const wait = typeof err?.retryDelaySeconds === 'number' ? err.retryDelaySeconds : null;

      return {
        isValid: false,
        feedbacks: [{
          id: `error-${Date.now()}`,
          type: 'warning',
          title: '⚠️ Erro na validação',
          explanation: isRateLimited
            ? `A API de validação atingiu o limite de uso (Gemini). ${wait ? `Aguarde ~${wait}s` : 'Aguarde alguns segundos'} e tente novamente.`
            : `Não foi possível validar o conteúdo da seção ${sectionName}.`,
          suggestion: isRateLimited
            ? 'Se o erro persistir, verifique a cota/plano da sua chave Gemini.'
            : 'Tente novamente mais tarde ou continue editando normalmente.'
        }]
      };
    }
  }
}

export const contentValidator = new ContentValidator();
