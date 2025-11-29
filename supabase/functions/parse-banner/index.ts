import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('Nenhum arquivo enviado');
    }

    console.log('Processando banner:', file.name, 'Tipo:', file.type);

    const fileBuffer = await file.arrayBuffer();
    let fullText = '';

    // Processar baseado no tipo de arquivo
    if (file.type === 'application/pdf') {
      fullText = await parsePDF(fileBuffer);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      fullText = await parseDOCX(fileBuffer);
    } else {
      throw new Error('Formato de arquivo não suportado. Use PDF ou DOCX.');
    }

    console.log('Texto extraído (primeiros 500 chars):', fullText.substring(0, 500));

    // Extrair seções do banner usando IA
    const parsedContent = await extractBannerSectionsWithAI(fullText);

    console.log('Seções do banner extraídas:', Object.keys(parsedContent));

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Erro ao processar banner:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

async function parseDOCX(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const result = await mammoth.extractRawText({ buffer: uint8Array });
  return result.value;
}

async function extractBannerSectionsWithAI(text: string) {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY não configurada, usando extração básica');
    return extractBannerSections(text);
  }

  try {
    const prompt = `Analise cuidadosamente o texto de um banner acadêmico/científico e extraia TODAS as seções principais. 
Banners geralmente são documentos resumidos apresentando um trabalho acadêmico.

INSTRUÇÕES CRÍTICAS:
1. Extraia o conteúdo COMPLETO de cada seção, não apenas um resumo
2. Mantenha toda a formatação e parágrafos originais
3. Se uma seção não existir, retorne string vazia ""
4. Banners costumam ter as seguintes seções: título, autores, instituição, introdução, objetivos, metodologia, resultados, conclusão, referências

SEÇÕES A EXTRAIR:

**title**: Título principal do banner (geralmente em destaque no topo, pode estar em MAIÚSCULAS ou negrito)

**authors**: Nomes completos dos autores com numeração sobrescrita se houver (ex: João Silva¹, Maria Santos²)

**institution**: Nome completo da instituição de ensino (ex: Instituto Federal de..., Universidade de...)

**introduction**: Seção de introdução ou contextualização. Pode ter títulos como:
  - "INTRODUÇÃO"
  - "CONTEXTUALIZAÇÃO" 
  - "APRESENTAÇÃO"
  - "PROBLEMA"
  Extraia TODO o conteúdo desta seção.

**objectives**: Objetivos do trabalho. Pode ter títulos como:
  - "OBJETIVOS"
  - "OBJETIVO GERAL"
  - "OBJETIVOS GERAIS E ESPECÍFICOS"
  Extraia TODO o conteúdo desta seção.

**methodology**: Metodologia utilizada. Pode ter títulos como:
  - "METODOLOGIA"
  - "MÉTODOS"
  - "PROCEDIMENTOS METODOLÓGICOS"
  - "MATERIAIS E MÉTODOS"
  Extraia TODO o conteúdo desta seção.

**results**: Resultados encontrados. Pode ter títulos como:
  - "RESULTADOS"
  - "RESULTADOS E DISCUSSÃO"
  - "ANÁLISE DOS RESULTADOS"
  - "DISCUSSÃO"
  Extraia TODO o conteúdo desta seção.

**conclusion**: Conclusões do trabalho. Pode ter títulos como:
  - "CONCLUSÃO"
  - "CONCLUSÕES"
  - "CONSIDERAÇÕES FINAIS"
  Extraia TODO o conteúdo desta seção.

**references**: Referências bibliográficas. Procure por:
  - "REFERÊNCIAS"
  - "REFERÊNCIAS BIBLIOGRÁFICAS"
  Extraia TODAS as referências completas.

Retorne APENAS JSON válido (sem markdown):
{
  "title": "...",
  "authors": "...",
  "institution": "...",
  "introduction": "...",
  "objectives": "...",
  "methodology": "...",
  "results": "...",
  "conclusion": "...",
  "references": "..."
}

IMPORTANTE: 
- Procure pelas seções em TODO o texto
- Se uma seção tiver um título diferente mas o conteúdo corresponder, inclua-a
- NÃO deixe seções vazias se houver conteúdo relevante no documento
- Banners são documentos curtos, então as seções podem ser mais resumidas que em artigos

TEXTO DO BANNER:
${text}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em análise de banners acadêmicos e científicos. Você deve extrair TODAS as seções do documento. Retorne apenas JSON válido, sem markdown ou explicações adicionais.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Erro na API de IA:', response.status);
      const errorText = await response.text();
      console.error('Resposta de erro:', errorText);
      return extractBannerSections(text);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Resposta da IA (primeiros 500 chars):', content.substring(0, 500));
    
    // Remover markdown code blocks se presentes
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiResult = JSON.parse(jsonStr);

    // Converter para HTML e aplicar padrão IFMS (título em CAIXA ALTA)
    const result: any = {
      title: cleanHtml(aiResult.title || '').toUpperCase(), // Padrão IFMS: título em CAIXA ALTA
      authors: cleanHtml(aiResult.authors || ''),
      institution: cleanHtml(aiResult.institution || 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul'),
      section1: cleanHtml(aiResult.introduction || ''),
      section2: cleanHtml(aiResult.objectives || ''),
      section3: cleanHtml(aiResult.methodology || ''),
      section4: cleanHtml(aiResult.results || ''),
      section5: cleanHtml(aiResult.conclusion || ''),
      section6: cleanHtml(aiResult.references || ''),
    };

    console.log('Seções do banner extraídas com sucesso:');
    console.log('- Title:', result.title ? 'OK' : 'VAZIO');
    console.log('- Authors:', result.authors ? 'OK' : 'VAZIO');
    console.log('- Institution:', result.institution ? 'OK' : 'VAZIO');
    console.log('- Section 1 (Intro):', result.section1 ? 'OK' : 'VAZIO');
    console.log('- Section 2 (Objectives):', result.section2 ? 'OK' : 'VAZIO');
    console.log('- Section 3 (Methodology):', result.section3 ? 'OK' : 'VAZIO');
    console.log('- Section 4 (Results):', result.section4 ? 'OK' : 'VAZIO');
    console.log('- Section 5 (Conclusion):', result.section5 ? 'OK' : 'VAZIO');
    console.log('- Section 6 (References):', result.section6 ? 'OK' : 'VAZIO');
    
    return result;

  } catch (error) {
    console.error('Erro ao usar IA para extração:', error);
    return extractBannerSections(text);
  }
}

function extractBannerSections(text: string) {
  // Limpar texto
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Função auxiliar para extrair entre dois padrões
  const extractBetween = (start: RegExp, end: RegExp): string => {
    const startMatch = cleanText.search(start);
    if (startMatch === -1) return '';
    
    const afterStart = cleanText.slice(startMatch);
    const endMatch = afterStart.search(end);
    
    if (endMatch === -1) return afterStart.replace(start, '').trim();
    
    return afterStart.slice(0, endMatch).replace(start, '').trim();
  };

  // Extrair título
  const titleMatch = cleanText.match(/^([A-ZÀÂÃÉÊÍÓÔÕÚÇ\s]{20,150}?)(?:\s+[A-Z][a-z])/);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extrair autores
  const authorsMatch = cleanText.match(/([A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ]\.?\s+)?[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:¹|²|³)?)/);
  const authors = authorsMatch ? authorsMatch[0].trim() : '';

  // Extrair instituição
  const institutionMatch = cleanText.match(/Instituto Federal[^.]+\./i);
  const institution = institutionMatch ? institutionMatch[0].trim() : 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul';

  // Extrair seções
  const section1 = extractBetween(/INTRODU[ÇC][ÃA]O|CONTEXTUALIZA[ÇC][ÃA]O/i, /OBJETIVOS?|METODOLOGIA/i);
  const section2 = extractBetween(/OBJETIVOS?/i, /METODOLOGIA|RESULTADOS/i);
  const section3 = extractBetween(/METODOLOGIA|M[ÉE]TODOS/i, /RESULTADOS/i);
  const section4 = extractBetween(/RESULTADOS/i, /CONCLUS[ÃA]O/i);
  const section5 = extractBetween(/CONCLUS[ÃA]O|CONSIDERA[ÇC][ÕO]ES FINAIS/i, /REFER[ÊE]NCIAS/i);
  
  // Extrair referências
  const referencesStart = cleanText.search(/REFER[ÊE]NCIAS/i);
  const section6 = referencesStart !== -1 ? cleanText.slice(referencesStart).replace(/REFER[ÊE]NCIAS\s*/i, '').trim() : '';

  return {
    title: cleanHtml(title).toUpperCase(), // Padrão IFMS: título em CAIXA ALTA
    authors: cleanHtml(authors),
    institution: cleanHtml(institution),
    section1: cleanHtml(section1),
    section2: cleanHtml(section2),
    section3: cleanHtml(section3),
    section4: cleanHtml(section4),
    section5: cleanHtml(section5),
    section6: cleanHtml(section6),
  };
}

function cleanHtml(text: string): string {
  if (!text) return '';
  
  // Converter para parágrafos básicos
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p}</p>`)
    .join('');
  
  return paragraphs || `<p>${text}</p>`;
}
