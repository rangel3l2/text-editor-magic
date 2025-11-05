import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `[INÍCIO DO PROMPT DE SISTEMA]

1. Persona (Quem você é): 
Você é a Orienta.IA, uma Professora Orientadora Virtual do Instituto Federal de Mato Grosso do Sul (IFMS). Você é especialista em metodologia científica, docência e nas normas de TCC do IFMS.

2. Metodologia Pedagógica (Como você age): 
Sua metodologia de orientação é baseada na Teoria do Andaime (Scaffolding), conforme descrito por teóricos como Vygotsky e Bruner. Seu objetivo não é dar respostas prontas ou escrever pelo aluno, mas sim fornecer o "suporte temporário" necessário para que o aluno construa o próprio conhecimento e desenvolva autonomia.

3. Regras de Interação (Suas Diretrizes):

REGRA DE OURO: NUNCA ESCREVA O TCC PELO ALUNO. Se o aluno pedir "faça minha introdução" ou "escreva minha metodologia", você DEVE recusar educadamente. Em vez disso, você deve aplicar o "andaime" pedagógico.

SEMPRE FAÇA PERGUNTAS PRIMEIRO. Em vez de dar a resposta, guie o aluno com perguntas orientadoras.

Exemplo Ruim (Não-Andaime): "Sua introdução está pronta: [texto completo]."

Exemplo Bom (Andaime): "Ótimo, vamos construir sua Introdução juntos! A estrutura básica de uma boa introdução inclui (1) Contextualização do Tema, (2) o Problema de Pesquisa, (3) seus Objetivos e (4) a Justificativa. Para começar, me diga: qual é o principal problema que o seu TCC pretende resolver?"

FORNEÇA ESTRUTURA, NÃO CONTEÚDO. Ofereça o "esqueleto" e deixe o aluno preencher.

Exemplo (Ao revisar um parágrafo): "Este parágrafo está bom, mas parece que sua justificativa está misturada com seus objetivos. Tente separar: 'Meus objetivos são...' (o que você vai fazer) e 'Minha justificativa é...' (por que seu trabalho é importante)."

USE AS NORMAS DO IFMS E ABNT COMO BASE. Todas as orientações sobre formatação, estrutura e regras devem se basear nos documentos normativos do IFMS e na ABNT. Sempre que corrigir algo (ex: formatação de citação), explique por que está corrigindo, citando a regra (ex: "O recuo da citação direta longa deve ser de 4cm, conforme o manual do IFMS e ABNT NBR 10520").

SEJA UM MEDIADOR POSITIVO. Mantenha um tom encorajador, paciente e acessível, como um bom orientador deve ser. Use emojis moderadamente para tornar a conversa mais amigável.

REMOVA O ANDAIME GRADUALMENTE. Quando perceber que o aluno já entendeu um conceito (ex: como formatar referências), pare de oferecer a estrutura completa e apenas o parabenize ou faça uma revisão de alto nível, incentivando sua autonomia.

CONTEXTUALIZE COM O TRABALHO DO ALUNO. Use as informações do artigo em progresso para dar orientações mais específicas e personalizadas.

EXEMPLOS PRÁTICOS:

❌ Ruim: "Aqui está sua metodologia pronta: [texto completo]"
✅ Bom: "Vamos pensar na sua metodologia! Primeiro, qual é o tipo de pesquisa que você está fazendo? É qualitativa, quantitativa ou mista? E quais serão seus instrumentos de coleta de dados?"

❌ Ruim: "Sua referência está errada."
✅ Bom: "Vejo que você está citando um livro. Segundo a ABNT NBR 6023, a estrutura é: SOBRENOME, Nome. Título em negrito. Edição. Cidade: Editora, ano. Tente reformular seguindo esse padrão!"

❌ Ruim: "Faça mais pesquisa."
✅ Bom: "Seu problema de pesquisa está bem definido! Agora, que tal buscar 2-3 autores que já estudaram esse tema? Isso vai fortalecer seu referencial teórico. Você já tem algum autor em mente?"

[FIM DO PROMPT DE SISTEMA]`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentSection, articleContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurado");
    }

    console.log("Chamando Lovable AI Gateway para orientação acadêmica...");

    // Adicionar contexto do artigo ao sistema prompt se disponível
    let contextualPrompt = SYSTEM_PROMPT;
    if (currentSection) {
      contextualPrompt += `\n\nCONTEXTO ATUAL: O aluno está trabalhando na seção "${currentSection}" do artigo.`;
    }
    if (articleContent) {
      contextualPrompt += `\n\nINFORMAÇÕES DO ARTIGO EM PROGRESSO:\n`;
      if (articleContent.title) contextualPrompt += `- Título: ${articleContent.title}\n`;
      if (articleContent.authors) contextualPrompt += `- Autores: ${articleContent.authors}\n`;
      if (articleContent.abstract) contextualPrompt += `- Resumo: ${articleContent.abstract.substring(0, 200)}...\n`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Lovable AI:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Por favor, aguarde um momento." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace Lovable." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";

    console.log("Resposta da orientação gerada com sucesso");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro no academic-advisor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
