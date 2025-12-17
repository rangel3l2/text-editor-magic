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

      // Prompt para validação do título usando Teoria do Andaime COM VERIFICAÇÃO DE COERÊNCIA
      const prompt = `
      Você é a Orienta.IA, uma Orientadora Virtual do IFMS especializada em metodologia científica.
      Sua metodologia é baseada na TEORIA DO ANDAIME (SCAFFOLDING) de Vygotsky e Bruner.

      **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com um TÍTULO ACADÊMICO.**

      Um TÍTULO acadêmico deve:
      - Ser uma frase única que identifica o tema da pesquisa
      - Ter no máximo 2-3 linhas (geralmente menos de 200 caracteres)
      - Ser conciso e objetivo
      - NÃO ser um texto longo, parágrafo extenso, discussão técnica, código, plano de implementação, conversa copiada, ou qualquer texto que não seja um título

      Conteúdo enviado: "${title}"
      Tamanho do conteúdo: ${title.length} caracteres

      **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
      SE o conteúdo tiver mais de 300 caracteres OU parecer um texto longo/discussão/código/plano/conversa:
      {
        "isValid": false,
        "feedbacks": [{
          "type": "warning",
          "title": "⚠️ Conteúdo Incoerente com a Seção",
          "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser um título acadêmico. Títulos são frases concisas que identificam o tema da pesquisa, não textos longos, discussões ou planos.",
          "suggestion": "Qual é o tema principal da sua pesquisa? Tente expressar em uma única frase concisa e direta."
        }]
      }

      SE o conteúdo parecer um título válido (curto, conciso, objetivo):
      - INICIE o explanation com "Usando a Teoria do Andaime..."
      - Reconheça o que o aluno fez
      - Faça PERGUNTAS orientadoras para refinar o título

      REGRAS DA METODOLOGIA SCAFFOLDING:
      1. NUNCA dê respostas prontas ou reescreva o título
      2. SEMPRE faça perguntas orientadoras primeiro
      3. Forneça estrutura, não conteúdo
      4. Use linguagem encorajadora e positiva

      Retorne APENAS este JSON:
      {
        "isValid": boolean,
        "feedbacks": [
          {
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título curto com emoji (💭 / 🤔 / ✅ / ✨ / ⚠️)",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Faça uma PERGUNTA orientadora"
          }
        ]
      }
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

      let prompt = '';
      const sectionLower = sectionName.toLowerCase();

      // =============================================
      // PRÉ-TEXTUAIS
      // =============================================

      // AUTORES
      if (sectionLower.includes("autores") || sectionLower.includes("autor") || sectionLower === "discente" || sectionLower === "docente") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo são NOMES DE PESSOAS (autores/orientadores).**

        Nomes de autores/orientadores devem:
        - Ser nomes de pessoas (Nome Sobrenome)
        - Podem ter títulos acadêmicos (Dr., Me., Prof.)
        - Formato: um nome por linha ou separados por vírgula
        - NÃO ser textos narrativos, discussões, códigos, planos, ou qualquer conteúdo sem relação com nomes de pessoas

        Conteúdo enviado: "${content.substring(0, 2000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo NÃO parecer nomes de pessoas (ex: texto longo, código, discussão, plano):
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser nome(s) de autor(es). Esta seção é destinada apenas para identificar quem escreveu o trabalho.",
            "suggestion": "Qual é o seu nome completo? Se houver outros autores, liste-os um por linha."
          }]
        }

        SE parecer nomes válidos:
        - Verifique se estão em formato adequado (Nome Completo)
        - Forneça feedback positivo ou orientações

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // INSTITUIÇÃO
      else if (sectionLower.includes("instituição") || sectionLower.includes("instituicao") || sectionLower === "institution") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é o NOME DE UMA INSTITUIÇÃO DE ENSINO.**

        Nome de instituição deve:
        - Ser o nome de uma instituição de ensino (universidade, instituto, escola)
        - Pode incluir campus, cidade e estado
        - Formato: Nome da Instituição - Campus - Cidade/Estado
        - NÃO ser textos narrativos, discussões, códigos, planos, ou qualquer conteúdo sem relação com nome de instituição

        Conteúdo enviado: "${content.substring(0, 1000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo NÃO parecer nome de instituição (ex: texto longo, código, discussão, plano):
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser o nome de uma instituição de ensino. Esta seção identifica onde o trabalho foi desenvolvido.",
            "suggestion": "Em qual instituição de ensino você está realizando este trabalho? Inclua o campus e cidade se aplicável."
          }]
        }

        SE parecer nome de instituição válido:
        - Verifique se está completo (nome, campus, cidade)
        - Forneça feedback positivo ou orientações

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // ORIENTADORES
      else if (sectionLower.includes("orientador") || sectionLower.includes("coorientador")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo são NOMES DE ORIENTADORES.**

        Nomes de orientadores devem:
        - Ser nomes de pessoas com títulos acadêmicos (Dr., Me., Prof., Esp.)
        - Formato: Título Nome Sobrenome
        - NÃO ser textos narrativos, discussões, códigos, planos, ou qualquer conteúdo sem relação com nomes de pessoas

        Conteúdo enviado: "${content.substring(0, 1000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo NÃO parecer nome de orientador (ex: texto longo, código, discussão, plano):
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser nome(s) de orientador(es). Esta seção identifica quem orientou o trabalho.",
            "suggestion": "Qual é o nome completo do seu orientador? Inclua o título acadêmico (Dr., Me., Prof.)."
          }]
        }

        SE parecer nome de orientador válido:
        - Verifique se inclui título acadêmico
        - Forneça feedback positivo ou orientações

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // SUBTÍTULO
      else if (sectionLower.includes("subtítulo") || sectionLower.includes("subtitle")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com um SUBTÍTULO ACADÊMICO.**

        Um subtítulo acadêmico deve:
        - Complementar o título principal (especificando escopo, metodologia, ou contexto)
        - Ter no máximo 1-2 linhas (geralmente menos de 150 caracteres)
        - Ser específico e direto
        - NÃO ser um texto longo, parágrafo extenso, discussão técnica, código, plano de implementação, conversa copiada

        Conteúdo enviado: "${content.substring(0, 2000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo tiver mais de 300 caracteres OU parecer um texto longo/discussão/código/plano/conversa:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser um subtítulo acadêmico. Subtítulos são frases curtas que complementam o título principal, não textos longos ou discussões.",
            "suggestion": "O que você está tentando comunicar com o subtítulo? Tente resumir em uma única frase curta que especifique o foco do seu trabalho."
          }]
        }

        SE parecer um subtítulo válido (curto, direto):
        - Analise usando a Teoria do Andaime com perguntas orientadoras

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // RESUMO / ABSTRACT
      else if (sectionLower.includes("resumo") || sectionLower.includes("abstract")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com um RESUMO/ABSTRACT ACADÊMICO.**

        Um Resumo/Abstract acadêmico deve:
        - Ser um texto acadêmico conciso (100-250 palavras)
        - Ter estrutura: contextualização, objetivo, metodologia, resultados, conclusão
        - Estar em um único parágrafo
        - NÃO ser código, plano técnico, conversa copiada, lista de tarefas, ou texto completamente fora de contexto acadêmico

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico, conversa, lista de tarefas, ou texto sem relação com resumo acadêmico:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser um resumo acadêmico. O resumo deve sintetizar o trabalho em um parágrafo conciso (100-250 palavras).",
            "suggestion": "Me conte: qual é o objetivo principal do seu trabalho? Como você o realizou? Quais foram os principais resultados?"
          }]
        }

        SE parecer um resumo válido:
        CONTEXTO IFMS: O resumo deve ser escrito POR ÚLTIMO, após o trabalho estar pronto.
        **ATENÇÃO: A contagem é de PALAVRAS, não caracteres!**
        - Mínimo: 100 PALAVRAS
        - Máximo: 250 PALAVRAS
        Estrutura ABNT 6028: Contextualização, Objetivo, Metodologia, Resultados, Conclusão.

        Analise e faça perguntas como:
        - "Qual o objetivo principal do seu trabalho?"
        - "Qual foi sua metodologia?"
        - "Quais seus principais resultados?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // PALAVRAS-CHAVE / KEYWORDS
      else if (sectionLower.includes("palavras-chave") || sectionLower.includes("keywords") || sectionLower.includes("palavra-chave")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo são PALAVRAS-CHAVE/KEYWORDS.**

        Palavras-chave devem:
        - Ser 3-5 termos que representem os conceitos principais da pesquisa
        - Estar separadas por ponto ou vírgula
        - Ser termos específicos (não muito genéricos)
        - NÃO ser frases longas, parágrafos, código, planos, ou texto narrativo

        Conteúdo enviado: "${content.substring(0, 1000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer um texto longo, código, plano, ou conteúdo sem relação com palavras-chave:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser palavras-chave. Esta seção deve conter 3-5 termos separados por ponto ou vírgula.",
            "suggestion": "Quais são os principais conceitos da sua pesquisa? Liste 3-5 termos que representem o núcleo do seu trabalho."
          }]
        }

        SE parecer palavras-chave válidas:
        CONTEXTO IFMS: Devem ser 3-5 termos que representem a pesquisa (não muito genéricos).

        Analise e faça perguntas como:
        - "Se você fosse pesquisar seu próprio artigo, quais termos usaria?"
        - "Esses termos são específicos suficiente para sua pesquisa?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // TEMA
      else if (sectionLower === "tema") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com a seção TEMA.**

        Um TEMA de pesquisa acadêmica deve:
        - Apresentar o assunto geral que será estudado
        - Ser uma descrição concisa (1-3 parágrafos no máximo)
        - Contextualizar o campo de estudo
        - NÃO ser código, plano de implementação, discussão técnica detalhada, conversa copiada, ou texto completamente fora de contexto acadêmico

        Conteúdo enviado: "${content.substring(0, 3000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico, conversa, ou texto completamente desconectado de um tema acadêmico:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser apropriado para a seção 'Tema'. Esta seção deve apresentar o assunto geral da sua pesquisa.",
            "suggestion": "Qual é o assunto principal que você quer estudar? Tente descrever em poucas palavras o campo ou área da sua pesquisa."
          }]
        }

        SE parecer um tema válido:
        - Analise usando a Teoria do Andaime com perguntas orientadoras

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // PROBLEMA
      else if (sectionLower === "problema") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com a seção PROBLEMA de pesquisa.**

        Um PROBLEMA de pesquisa acadêmica deve:
        - Apresentar uma questão ou lacuna a ser investigada
        - Ser formulado como pergunta ou afirmação de um problema específico
        - Estar relacionado ao tema de pesquisa
        - NÃO ser código, plano de implementação, conversa copiada, ou texto completamente fora de contexto acadêmico

        Conteúdo enviado: "${content.substring(0, 3000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico, conversa, ou texto completamente desconectado de um problema de pesquisa:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser apropriado para a seção 'Problema'. Esta seção deve apresentar a questão ou lacuna que sua pesquisa pretende investigar.",
            "suggestion": "Qual é a pergunta que sua pesquisa quer responder? Qual problema você identificou que precisa ser estudado?"
          }]
        }

        SE parecer um problema de pesquisa válido:
        - Analise usando a Teoria do Andaime com perguntas orientadoras

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }

      // =============================================
      // TEXTUAIS
      // =============================================

      // INTRODUÇÃO
      else if (sectionLower.includes("introdução") || sectionLower.includes("introducao")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com uma INTRODUÇÃO ACADÊMICA.**

        Uma Introdução acadêmica deve:
        - Apresentar o tema e contextualizar a pesquisa
        - Justificar a relevância do estudo
        - Apresentar o problema de pesquisa e os objetivos
        - Ser um texto acadêmico estruturado
        - NÃO ser código, plano de implementação, conversa copiada, lista de tarefas, ou texto completamente fora de contexto acadêmico

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico, conversa, lista de tarefas, ou texto sem relação com introdução acadêmica:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser uma introdução acadêmica. A introdução deve apresentar o tema, justificar sua relevância e apresentar o problema de pesquisa.",
            "suggestion": "Qual é o tema da sua pesquisa? Por que ele é importante? Qual problema você pretende investigar?"
          }]
        }

        SE parecer uma introdução válida:
        CONTEXTO IFMS: A Introdução deve apresentar o tema, justificar sua relevância, apresentar o problema de pesquisa e os objetivos.

        Analise e faça perguntas como:
        - "Você apresentou o tema da pesquisa? Como você contextualiza esse tema?"
        - "Por que esse tema é importante ou relevante hoje?"
        - "Qual é o problema específico que você quer investigar?"
        - "Quais são seus objetivos com essa pesquisa?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // OBJETIVOS
      else if (sectionLower === "objetivos" || sectionLower.includes("objetivo geral") || sectionLower.includes("objetivos específicos")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo são OBJETIVOS DE PESQUISA.**

        Objetivos de pesquisa devem:
        - Iniciar com verbos no infinitivo (analisar, investigar, compreender, desenvolver, etc.)
        - Ter um objetivo geral e objetivos específicos
        - Ser claros, mensuráveis e alcançáveis
        - Estar relacionados ao problema de pesquisa
        - NÃO ser código, plano de implementação, conversa copiada, ou texto completamente fora de contexto acadêmico

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico, conversa, ou texto sem relação com objetivos de pesquisa:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser objetivos de pesquisa. Os objetivos devem iniciar com verbos no infinitivo e indicar o que você pretende alcançar.",
            "suggestion": "O que você pretende alcançar com sua pesquisa? Tente começar com 'Analisar...', 'Investigar...', 'Compreender...', etc."
          }]
        }

        SE parecer objetivos válidos:
        CONTEXTO IFMS: Os objetivos devem ser claros, mensuráveis e alcançáveis.

        Analise e faça perguntas como:
        - "O objetivo geral está claro e alinhado com seu problema de pesquisa?"
        - "Os objetivos específicos são mensuráveis?"
        - "Eles realmente contribuem para alcançar o objetivo geral?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // TÓPICOS TEÓRICOS / FUNDAMENTAÇÃO / REFERENCIAL TEÓRICO
      else if (sectionLower.includes("tópico") || sectionLower.includes("topico") || sectionLower.includes("fundamentação") || sectionLower.includes("referencial teórico") || sectionLower.includes("revisão de literatura")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com FUNDAMENTAÇÃO TEÓRICA.**

        Fundamentação Teórica deve:
        - Apresentar autores e teorias que fundamentam a pesquisa
        - Usar citações no formato ABNT (diretas, indiretas, apud)
        - Demonstrar conhecimento sobre o tema estudado
        - Ser um texto acadêmico com referências bibliográficas
        - NÃO ser código, plano de implementação, conversa copiada, lista de tarefas, ou texto sem citações/referências

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico, conversa, lista de tarefas, ou texto sem características de fundamentação teórica:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser fundamentação teórica. Esta seção deve apresentar autores e teorias que fundamentam sua pesquisa, com citações no formato ABNT.",
            "suggestion": "Quais autores você está usando para fundamentar sua pesquisa? Como você está citando as ideias deles no formato ABNT?"
          }]
        }

        SE parecer fundamentação teórica válida:
        CONTEXTO IFMS: Deve apresentar autores relevantes, evitar plágio, e usar citações ABNT corretas.

        Analise e faça perguntas como:
        - "Quais autores fundamentam sua pesquisa?"
        - "Como você está usando as citações deles?"
        - "Está formatando corretamente segundo a ABNT?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // METODOLOGIA
      else if (sectionLower.includes("metodologia") || sectionLower.includes("método") || sectionLower.includes("procedimentos metodológicos")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com METODOLOGIA DE PESQUISA.**

        Metodologia de pesquisa deve:
        - Descrever "como se fez" a pesquisa
        - Identificar o tipo de pesquisa (qualitativa, quantitativa, bibliográfica, etc.)
        - Descrever instrumentos de coleta de dados
        - Explicar procedimentos de análise
        - NÃO confundir com código fonte ou documentação técnica de software
        - NÃO ser conversa copiada, plano de tarefas, ou texto fora de contexto

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer apenas código fonte, conversa copiada, plano de tarefas, ou texto sem relação com metodologia científica:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser metodologia de pesquisa. Esta seção deve descrever COMO você realizou sua pesquisa (tipo de pesquisa, instrumentos, procedimentos).",
            "suggestion": "Como você coletou os dados para sua pesquisa? Qual foi o tipo de pesquisa (Estudo de Caso, Pesquisa-Ação, etc.)? Quais instrumentos você usou?"
          }]
        }

        SE parecer metodologia válida:
        CONTEXTO IFMS: Não confundir metodologia de pesquisa com ferramentas técnicas. Pode ter subseções.

        Analise e faça perguntas como:
        - "Que tipo de pesquisa você está realizando?"
        - "Como você pretende coletar os dados?"
        - "Por que escolheu essa abordagem metodológica?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // RESULTADOS E DISCUSSÃO
      else if (sectionLower.includes("resultado") || sectionLower.includes("discussão") || sectionLower.includes("discussao") || sectionLower.includes("análise")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com RESULTADOS E DISCUSSÃO.**

        Resultados e Discussão devem:
        - Apresentar os dados coletados na pesquisa
        - Analisar e interpretar os resultados
        - Conectar os achados com a fundamentação teórica
        - Usar quadros, tabelas ou gráficos quando apropriado
        - NÃO ser código fonte, conversa copiada, plano de tarefas, ou texto sem relação com resultados de pesquisa

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código fonte, conversa copiada, plano de tarefas, ou texto sem relação com resultados de pesquisa:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser resultados e discussão. Esta seção deve apresentar os dados coletados e sua análise, conectando com a teoria.",
            "suggestion": "Quais dados você coletou na sua pesquisa? O que eles revelam? Como eles se relacionam com o que os autores disseram na fundamentação teórica?"
          }]
        }

        SE parecer resultados válidos:
        CONTEXTO IFMS: Faça a DISCUSSÃO conectando resultados com os autores da Fundamentação Teórica.

        Analise e faça perguntas como:
        - "O que seus dados revelaram?"
        - "Isso confirma ou contradiz o que o Autor X disse?"
        - "Quais são as implicações práticas desses achados?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // CONCLUSÃO / CONSIDERAÇÕES FINAIS
      else if (sectionLower.includes("conclusão") || sectionLower.includes("conclusao") || sectionLower.includes("considerações finais")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com CONCLUSÃO/CONSIDERAÇÕES FINAIS.**

        Conclusão deve:
        - Retomar os objetivos da pesquisa
        - Avaliar se os objetivos foram alcançados
        - Apresentar as principais contribuições do trabalho
        - Apontar limitações e sugestões para trabalhos futuros
        - NÃO ser código, conversa copiada, plano de tarefas, ou simplesmente repetir o resumo/introdução

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, conversa copiada, plano de tarefas, ou texto sem relação com conclusão acadêmica:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser uma conclusão acadêmica. A conclusão deve retomar os objetivos e avaliar o que foi alcançado.",
            "suggestion": "Você conseguiu alcançar os objetivos que definiu na introdução? Quais foram as principais contribuições do seu trabalho? Quais limitações você identificou?"
          }]
        }

        SE parecer conclusão válida:
        CONTEXTO IFMS: Deve retomar os objetivos e avaliar se foram alcançados.

        Analise e faça perguntas como:
        - "Seu trabalho conseguiu responder aos objetivos?"
        - "Quais foram as limitações da sua pesquisa?"
        - "O que você sugere para trabalhos futuros?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }

      // =============================================
      // PÓS-TEXTUAIS
      // =============================================

      // REFERÊNCIAS
      else if (sectionLower.includes("referências") || sectionLower.includes("referencias") || sectionLower === "references") {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo são REFERÊNCIAS BIBLIOGRÁFICAS.**

        Referências bibliográficas devem:
        - Seguir o formato ABNT NBR 6023
        - Estar alinhadas à esquerda
        - Ter espaçamento simples entre linhas
        - Incluir: AUTOR. Título. Edição. Local: Editora, Ano.
        - NÃO ser código, conversa copiada, texto narrativo, ou conteúdo sem formato de referência bibliográfica

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, conversa, texto narrativo, ou conteúdo sem formato de referência bibliográfica:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser referências bibliográficas. Esta seção deve conter as fontes citadas no trabalho, formatadas segundo ABNT.",
            "suggestion": "Quais obras você citou no seu trabalho? Cada referência deve seguir o formato: SOBRENOME, Nome. Título da obra. Local: Editora, Ano."
          }]
        }

        SE parecer referências válidas:
        CONTEXTO IFMS: As referências devem seguir ABNT NBR 6023.

        Analise e faça perguntas como:
        - "Todos os autores citados no texto estão listados aqui?"
        - "A formatação está seguindo a ABNT?"

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // APÊNDICES
      else if (sectionLower.includes("apêndice") || sectionLower.includes("apendice")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com APÊNDICES.**

        Apêndices devem:
        - Conter materiais ELABORADOS PELO AUTOR do trabalho
        - Exemplos: questionários, roteiros de entrevista, formulários, tabelas criadas pelo autor
        - Complementar o trabalho sem ser essencial para a compreensão
        - NÃO ser código fonte de software, conversa copiada, ou texto narrativo principal

        Conteúdo enviado: "${content.substring(0, 3000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer conversa copiada, texto narrativo principal, ou conteúdo sem relação com materiais complementares:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser apropriado para apêndice. Apêndices contêm materiais ELABORADOS POR VOCÊ que complementam o trabalho.",
            "suggestion": "Você elaborou algum questionário, roteiro de entrevista, ou outro instrumento para sua pesquisa? Esses são exemplos típicos de apêndices."
          }]
        }

        SE parecer apêndice válido:
        - Verifique se está identificado corretamente (APÊNDICE A, B, etc.)
        - Forneça feedback sobre formatação

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }
      // ANEXOS
      else if (sectionLower.includes("anexo")) {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com ANEXOS.**

        Anexos devem:
        - Conter materiais de TERCEIROS (não elaborados pelo autor)
        - Exemplos: documentos oficiais, leis, tabelas de outros autores, certificados
        - Complementar o trabalho sem ser essencial para a compreensão
        - NÃO ser código fonte de software, conversa copiada, ou texto narrativo principal

        Conteúdo enviado: "${content.substring(0, 3000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer conversa copiada, texto narrativo principal, ou conteúdo sem relação com materiais de terceiros:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser apropriado para anexo. Anexos contêm materiais de TERCEIROS que complementam o trabalho.",
            "suggestion": "Você tem algum documento oficial, lei, ou material de outros autores que complementa sua pesquisa? Esses são exemplos típicos de anexos."
          }]
        }

        SE parecer anexo válido:
        - Verifique se está identificado corretamente (ANEXO A, B, etc.)
        - Forneça feedback sobre formatação

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
        }
        `;
      }

      // =============================================
      // PROMPT GENÉRICO (fallback para seções não mapeadas)
      // =============================================
      else {
        prompt = `
        Você é a Orienta.IA usando a TEORIA DO ANDAIME (SCAFFOLDING).

        **CRÍTICO: PRIMEIRO verifique se o conteúdo é COERENTE com a seção "${sectionName}".**

        O conteúdo inserido deve:
        - Estar relacionado ao propósito da seção "${sectionName}"
        - Ser apropriado para um trabalho acadêmico
        - NÃO ser código fonte de software, planos de implementação técnica, conversas copiadas de chat, listas de tarefas de programação, ou conteúdo completamente fora de contexto acadêmico

        Conteúdo enviado: "${content.substring(0, 5000)}"
        Tamanho do conteúdo: ${content.length} caracteres

        **REGRA DE COERÊNCIA (VERIFICAR PRIMEIRO):**
        SE o conteúdo parecer código, plano técnico de software, conversa de chat, lista de tarefas, ou texto completamente desconectado de conteúdo acadêmico:
        {
          "isValid": false,
          "feedbacks": [{
            "type": "warning",
            "title": "⚠️ Conteúdo Incoerente com a Seção",
            "explanation": "Usando a Teoria do Andaime, percebo que o conteúdo inserido não parece ser apropriado para a seção '${sectionName}'. O texto não corresponde ao que se espera nesta seção de um trabalho acadêmico.",
            "suggestion": "O que você realmente gostaria de escrever para esta seção? Me conte sobre o assunto do seu trabalho e como ele se relaciona com '${sectionName}'."
          }]
        }

        SE o conteúdo for coerente com a seção:
        - INICIE o explanation com "Usando a Teoria do Andaime..."
        - Reconheça o que o aluno já escreveu
        - Faça PERGUNTAS orientadoras para desenvolver o conteúdo
        - Mantenha tom encorajador e pedagógico

        Retorne APENAS este JSON:
        {
          "isValid": boolean,
          "feedbacks": [{
            "type": "success" | "tip" | "warning" | "excellent",
            "title": "Título com emoji",
            "explanation": "INICIE com 'Usando a Teoria do Andaime...'",
            "suggestion": "Pergunta orientadora"
          }]
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
