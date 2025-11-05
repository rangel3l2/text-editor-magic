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

    console.log('Processando arquivo:', file.name, 'Tipo:', file.type);

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

    // Extrair seções do artigo usando IA
    const parsedContent = await extractArticleSectionsWithAI(fullText);

    console.log('Seções extraídas:', Object.keys(parsedContent));

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Erro ao processar artigo:', error);
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
  // Converter ArrayBuffer para Buffer
  const uint8Array = new Uint8Array(buffer);
  const result = await mammoth.extractRawText({ buffer: uint8Array });
  return result.value;
}

async function extractArticleSectionsWithAI(text: string) {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY não configurada, usando extração regex');
    return extractArticleSections(text);
  }

  try {
    const prompt = `Analise o texto de um artigo científico abaixo e extraia as seguintes seções. IGNORE completamente cabeçalhos e rodapés de página. Foque apenas no conteúdo principal do artigo.

Extraia exatamente estas seções (retorne vazio se não encontrar):
- title: Título principal do artigo (geralmente em MAIÚSCULAS no início)
- authors: Nome dos autores (após o título, antes do RESUMO)
- advisors: Nome dos orientadores (geralmente em notas de rodapé ou após autores)
- abstract: Texto do RESUMO em português (após "RESUMO" e antes de "Palavras-chave")
- keywords: Palavras-chave em português (após "Palavras-chave:" e antes de "ABSTRACT")
- englishAbstract: Texto do ABSTRACT em inglês (após "ABSTRACT" e antes de "Keywords")
- englishKeywords: Keywords em inglês (após "Keywords:")
- introduction: Seção de INTRODUÇÃO (geralmente seção 1)
- methodology: Seção de METODOLOGIA (procure por títulos como "Metodologia", "Materiais e Métodos", etc.)
- results: Seção de RESULTADOS e/ou DISCUSSÃO (procure por "Resultados", "Resultados e Discussão", etc.)
- conclusion: Seção de CONCLUSÃO (procure por "Conclusão", "Considerações Finais", etc.)
- references: Seção de REFERÊNCIAS (após "REFERÊNCIAS" ou "REFERÊNCIAS BIBLIOGRÁFICAS")

Retorne APENAS um JSON válido no formato:
{
  "title": "...",
  "authors": "...",
  "advisors": "...",
  "abstract": "...",
  "keywords": "...",
  "englishAbstract": "...",
  "englishKeywords": "...",
  "introduction": "...",
  "methodology": "...",
  "results": "...",
  "conclusion": "...",
  "references": "..."
}

TEXTO DO ARTIGO:
${text.substring(0, 15000)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em análise de artigos científicos. Retorne apenas JSON válido, sem markdown ou explicações adicionais.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Erro na API de IA:', response.status);
      return extractArticleSections(text);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Remover markdown code blocks se presentes
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiResult = JSON.parse(jsonStr);

    // Converter para HTML e adicionar instituição padrão
    const result = {
      title: cleanHtml(aiResult.title || ''),
      authors: cleanHtml(aiResult.authors || ''),
      advisors: cleanHtml(aiResult.advisors || ''),
      abstract: cleanHtml(aiResult.abstract || ''),
      keywords: cleanHtml(aiResult.keywords || ''),
      englishAbstract: cleanHtml(aiResult.englishAbstract || ''),
      englishKeywords: cleanHtml(aiResult.englishKeywords || ''),
      introduction: cleanHtml(aiResult.introduction || ''),
      methodology: cleanHtml(aiResult.methodology || ''),
      results: cleanHtml(aiResult.results || ''),
      conclusion: cleanHtml(aiResult.conclusion || ''),
      references: cleanHtml(aiResult.references || ''),
      institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
    };

    console.log('Extração por IA concluída com sucesso');
    return result;

  } catch (error) {
    console.error('Erro ao usar IA para extração:', error);
    return extractArticleSections(text);
  }
}

function extractArticleSections(text: string) {
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

  // Extrair título (geralmente em MAIÚSCULAS no início, após cabeçalho)
  const titleMatch = cleanText.match(/(?:Campus\s+[^\n]+\s+)([A-ZÀÂÃÉÊÍÓÔÕÚÇ\s]{20,150}?)(?:\s+[A-Z][a-z]|\s+RESUMO)/);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extrair autores (geralmente antes do RESUMO e após o título)
  const authorsMatch = cleanText.match(/([A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ]\.?\s+)?[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+)*¹?)(?:\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ]\.?\s+)?[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+²?)?/);
  const authors = authorsMatch ? authorsMatch[0].trim() : '';

  // Extrair orientadores (geralmente nas notas de rodapé)
  const advisorMatch = cleanText.match(/(?:Professor|Orientador|Mestre|Doutor)[^.]+\.(?:\s+Professor[^.]+\.)?/i);
  const advisors = advisorMatch ? advisorMatch[0].trim() : '';

  // Extrair resumo
  const abstract = extractBetween(/RESUMO\s*/i, /Palavras-chave:/i);

  // Extrair palavras-chave
  const keywordsMatch = cleanText.match(/Palavras-chave:\s*([^.]+(?:\.[^.]+){2,}\.)/i);
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';

  // Extrair abstract
  const englishAbstract = extractBetween(/ABSTRACT\s*/i, /Keywords:/i);

  // Extrair keywords
  const englishKeywordsMatch = cleanText.match(/Keywords:\s*([^.]+\.)/i);
  const englishKeywords = englishKeywordsMatch ? englishKeywordsMatch[1].trim() : '';

  // Extrair introdução
  const introduction = extractBetween(/1\s+INTRODU[ÇC][ÃA]O/i, /2\s+(?:REFERENCIAL|FUNDAMENTA[ÇC][ÃA]O|DESENVOLVIMENTO)/i);

  // Extrair metodologia
  const methodology = extractBetween(/METODOLOGIA/i, /RESULTADOS/i);

  // Extrair resultados
  const results = extractBetween(/RESULTADOS/i, /CONCLUS[ÃA]O/i);

  // Extrair conclusão
  const conclusion = extractBetween(/CONCLUS[ÃA]O/i, /REFER[ÊE]NCIAS/i);

  // Extrair referências
  const referencesStart = cleanText.search(/REFER[ÊE]NCIAS/i);
  const references = referencesStart !== -1 ? cleanText.slice(referencesStart).replace(/REFER[ÊE]NCIAS\s*/i, '').trim() : '';

  return {
    title: cleanHtml(title),
    authors: cleanHtml(authors),
    advisors: cleanHtml(advisors),
    abstract: cleanHtml(abstract),
    keywords: cleanHtml(keywords),
    englishAbstract: cleanHtml(englishAbstract),
    englishKeywords: cleanHtml(englishKeywords),
    introduction: cleanHtml(introduction),
    methodology: cleanHtml(methodology),
    results: cleanHtml(results),
    conclusion: cleanHtml(conclusion),
    references: cleanHtml(references),
    institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
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
