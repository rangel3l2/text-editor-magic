import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createGeminiClient } from "../_shared/geminiClient.ts";

interface SegmentIntroductionRequest {
  introduction: string;
}

interface SegmentedIntroduction {
  theme: string;
  problem: string;
  objectives: string;
  irrelevant: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData = await req.json().catch(() => null);
    
    if (!requestData || !requestData.introduction) {
      return new Response(
        JSON.stringify({ error: "Parameter 'introduction' is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { introduction } = requestData as SegmentIntroductionRequest;

    console.log(`📝 Segmentando introdução de ${introduction.length} caracteres`);

    const model = await createGeminiClient();

    const prompt = `Você é um especialista em análise de textos acadêmicos seguindo normas ABNT e IFMS. Analise a introdução abaixo e segmente-a em partes específicas.

PARTES ESPERADAS EM UMA INTRODUÇÃO ACADÊMICA:

1. **Tema/Contextualização (theme)**: Apresenta o tema geral, contextualiza o campo de estudo, traz informações da literatura e estatísticas relevantes. Situa o leitor no contexto geral do assunto.

2. **Problema/Problematização (problem)**: Delimita o problema específico, mostra a lacuna no conhecimento atual e esclarece qual questão o estudo busca responder. Afunila do contexto geral para o problema específico.

3. **Objetivos/Justificativa (objectives)**: Apresenta os objetivos do trabalho (geral e específicos) e justifica sua importância e relevância para a área.

4. **Conteúdo Irrelevante (irrelevant)**: Trechos que NÃO pertencem a uma introdução acadêmica. Exemplos: metodologia detalhada, resultados de pesquisa, código de programação, receitas, textos sobre assuntos totalmente desconectados do contexto acadêmico, conclusões finais, referências bibliográficas listadas, etc.

REGRAS IMPORTANTES:
- Identifique e separe as partes do texto fornecido
- Mantenha o texto original de cada parte sem modificar
- Se alguma parte não estiver claramente presente, retorne uma string vazia para ela
- Se encontrar trechos que claramente NÃO pertencem a uma introdução acadêmica, coloque-os no campo "irrelevant"
- Retorne APENAS um objeto JSON válido, sem explicações adicionais
- NÃO use blocos markdown como \`\`\`json ou \`\`\` na resposta

Introdução para segmentar:
${introduction}

Retorne no formato JSON:
{
  "theme": "texto da parte de contextualização do tema",
  "problem": "texto da parte de problematização",
  "objectives": "texto da parte de objetivos e justificativa",
  "irrelevant": "trechos que não pertencem a uma introdução acadêmica"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("📤 Resposta bruta do Gemini:", text.substring(0, 200));

    // Parse JSON response
    let segmented: SegmentedIntroduction;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      segmented = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON:", parseError);
      console.error("Texto recebido:", text);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate response structure
    if (!segmented.theme && !segmented.problem && !segmented.objectives && !segmented.irrelevant) {
      throw new Error("AI failed to segment introduction properly");
    }

    console.log("✅ Segmentação concluída:", {
      themeLength: segmented.theme?.length || 0,
      problemLength: segmented.problem?.length || 0,
      objectivesLength: segmented.objectives?.length || 0,
      irrelevantLength: segmented.irrelevant?.length || 0
    });

    return new Response(
      JSON.stringify({
        theme: segmented.theme || "",
        problem: segmented.problem || "",
        objectives: segmented.objectives || "",
        irrelevant: segmented.irrelevant || ""
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error during segmentation:", error);
    
    return new Response(
      JSON.stringify({ 
        error: `Error during segmentation: ${error.message}`,
        theme: "",
        problem: "",
        objectives: "",
        irrelevant: ""
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
