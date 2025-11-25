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

async function extractArticleSectionsWithAI(text: string, images?: Array<{url: string, caption?: string}>) {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY não configurada, usando extração regex');
    return extractArticleSections(text);
  }

  try {
    let imagePromptPart = '';
    if (images && images.length > 0) {
      imagePromptPart = `\n\nIMAGENS ENCONTRADAS NO DOCUMENTO (${images.length} no total):
      ${images.map((img, i) => `\nImagem ${i + 1}: ${img.caption || 'Sem legenda'}`).join('')}
      
      IMPORTANTE: Para cada imagem encontrada, identifique:
      - O tipo (Figura, Gráfico ou Tabela)
      - A legenda completa (ex: "Figura 1: Descrição...")
      - A fonte (ex: "Fonte: Autores (2024)" ou "Fonte: Silva (2020)")
      - A seção onde deve ser inserida
      
      Adicione ao JSON um campo "images" com array de objetos contendo: type, caption, source, section`;
    }
    
    const prompt = `Analise cuidadosamente o texto de um artigo científico e extraia TODAS as seções principais. IGNORE cabeçalhos, rodapés e numeração de página.${imagePromptPart}

INSTRUÇÕES CRÍTICAS:
1. Extraia o conteúdo COMPLETO de cada seção, não apenas um resumo
2. Mantenha toda a formatação e parágrafos originais
3. Se uma seção não existir, retorne string vazia ""
4. Para referências, extraia TODAS as referências bibliográficas completas

SEÇÕES A EXTRAIR:

**title**: Título principal do artigo (geralmente em MAIÚSCULAS ou negrito no início)

**authors**: Nomes completos dos autores com numeração sobrescrita (ex: João Silva¹, Maria Santos²). 
  - Geralmente aparecem logo após o título e ANTES do "RESUMO"
  - Têm superscripts ¹, ², ³
  - Formato: "Nome Completo¹" ou "Nome Completo¹, Outro Nome²"
  - NÃO confundir com títulos de seções, instituições ou palavras técnicas

**advisors**: Nome(s) do(s) orientador(es). Procure nas NOTAS DE RODAPÉ da primeira página:
  - Busque por linhas com ¹, ², ³ que mencionem "Professor", "Mestre", "Doutor"
  - Exemplo: "² Mestre em... Professor no Instituto..." - EXTRAIA apenas o nome completo
  - Se houver múltiplos autores, o orientador geralmente é o último (com maior número de superscript)
  - Formato esperado: apenas o nome, sem cargos (ex: "Alex F. de Araujo")

**abstract**: Conteúdo COMPLETO após "RESUMO" até "Palavras-chave"

**keywords**: APENAS a lista de palavras-chave após "Palavras-chave:" (separadas por vírgula)
  - Parar ANTES de qualquer nota de rodapé ou informação dos autores
  - NÃO incluir dados biográficos, e-mails ou informações institucionais
  - Formato: "Palavra 1, Palavra 2, Palavra 3"

**englishAbstract**: Conteúdo COMPLETO após "ABSTRACT" até "Keywords:"
  - Parar ANTES de "Keywords:" 
  - NÃO incluir "Data de aprovação" ou outras informações

**englishKeywords**: APENAS a lista após "Keywords:" (separadas por vírgula)
  - Parar ANTES de "Data de aprovação" ou qualquer outra informação
  - Formato: "Keyword 1, Keyword 2, Keyword 3"

**introduction**: TODA a seção 1 INTRODUÇÃO completa, do início até o final da seção (antes da seção 2)

**theoreticalTopics**: Identifique TODOS os subtópicos da seção 2 (Referencial Teórico/Fundamentação). Cada subtópico numerado (2.1, 2.2, etc.) deve ser extraído como:
  - title: título do subtópico SEM o número
  - content: conteúdo completo do subtópico até o próximo subtópico

**methodology**: Conteúdo COMPLETO da seção de metodologia (pode ser "METODOLOGIA", "MATERIAIS E MÉTODOS", "PROCEDIMENTOS METODOLÓGICOS", "MÉTODO", ou similar, geralmente seção 3 ou 4). Procure pela seção numerada (3. ou 4.) e extraia TODO o conteúdo até a próxima seção.

**results**: Conteúdo COMPLETO da seção de resultados. ATENÇÃO: Esta seção pode ter títulos variados:
  - "RESULTADOS"
  - "RESULTADOS E DISCUSSÃO" 
  - "RESULTADOS E DISCUSSÕES"
  - "ANÁLISE DOS RESULTADOS"
  - "DISCUSSÃO"
  - "ANÁLISE E DISCUSSÃO DOS RESULTADOS"
  Geralmente é a penúltima ou antepenúltima seção (antes da conclusão). Extraia TODO o conteúdo desta seção até a próxima seção principal.

**conclusion**: Conteúdo COMPLETO da conclusão. ATENÇÃO: Esta seção pode ter títulos variados:
  - "CONCLUSÃO"
  - "CONCLUSÕES"
  - "CONSIDERAÇÕES FINAIS"
  - "CONCLUSÕES E CONSIDERAÇÕES FINAIS"
  Geralmente é a última seção antes das referências. Extraia TODO o conteúdo até "REFERÊNCIAS".

**references**: TODAS as referências bibliográficas completas. Procure por:
  - "REFERÊNCIAS"
  - "REFERÊNCIAS BIBLIOGRÁFICAS"
  - Seção após a conclusão com lista de citações formatadas
  Extraia TODO o conteúdo desta seção até o final do documento.

**images** (SE HOUVER): Array com informações de cada imagem:
  - type: "figura" | "grafico" | "tabela"
  - caption: legenda completa (ex: "Figura 1: Esquema do processo")
  - source: fonte da imagem (ex: "Fonte: Autores (2024)")
  - section: seção onde aparece ("introduction" | "methodology" | "results" | "conclusion")

Retorne APENAS JSON válido (sem markdown):
{
  "title": "...",
  "authors": "...",
  "advisors": "...",
  "abstract": "...",
  "keywords": "...",
  "englishAbstract": "...",
  "englishKeywords": "...",
  "introduction": "...",
  "theoreticalTopics": [{"title": "...", "content": "..."}, ...],
  "methodology": "...",
  "results": "...",
  "conclusion": "...",
  "references": "...",
  "images": [{"type": "figura", "caption": "...", "source": "...", "section": "results"}, ...]
}

IMPORTANTE - REGRAS DE EXTRAÇÃO: 
- Procure pelas seções em TODO o texto, não apenas no início
- Resultados e Conclusão costumam estar no FINAL do documento
- Referências sempre está no FINAL, após a conclusão
- Se uma seção tiver um título diferente mas o conteúdo corresponder, inclua-a
- NÃO deixe seções vazias se houver conteúdo relevante no documento

IMPORTANTE - SEPARAÇÃO DE CAMPOS:
- "authors" deve conter APENAS nomes (com superscripts ¹, ²)
- "advisors" deve extrair o nome do orientador das notas de rodapé
- "keywords" deve conter APENAS as palavras-chave, SEM notas de rodapé ou e-mails
- "englishKeywords" deve conter APENAS as keywords, SEM "Data de aprovação"
- NÃO misture informações de diferentes campos

TEXTO DO ARTIGO:
${text}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em análise de artigos científicos acadêmicos brasileiros. REGRAS CRÍTICAS: 1) "authors" são os nomes após o título (ex: "Rangel Silva¹, Maria Santos²"). 2) "advisors" é extraído das NOTAS DE RODAPÉ - busque por linhas com ² ou ³ que mencionem "Professor" e extraia APENAS o nome. 3) "keywords" são APENAS as palavras após "Palavras-chave:", SEM notas de rodapé. 4) Retorne apenas JSON válido, sem markdown.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Erro na API de IA:', response.status);
      const errorText = await response.text();
      console.error('Resposta de erro:', errorText);
      return extractArticleSections(text);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Resposta da IA (primeiros 1000 chars):', content.substring(0, 1000));
    
    // Remover markdown code blocks se presentes
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiResult = JSON.parse(jsonStr);

    // Converter para HTML e adicionar instituição padrão
    const result: any = {
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

    // Processar tópicos teóricos se existirem
    if (aiResult.theoreticalTopics && Array.isArray(aiResult.theoreticalTopics)) {
      result.theoreticalTopics = aiResult.theoreticalTopics.map((topic: any, index: number) => ({
        id: `topic-${index + 1}`,
        order: index + 1,
        title: topic.title || `Tópico ${index + 1}`,
        content: cleanHtml(topic.content || '')
      }));
    }

    // Processar imagens se existirem
    if (aiResult.images && Array.isArray(aiResult.images)) {
      result.images = aiResult.images.map((img: any) => ({
        type: img.type || 'figura',
        caption: img.caption || '',
        source: img.source || 'Fonte: Documento original',
        section: img.section || 'results'
      }));
    }

    console.log('Seções extraídas com sucesso:');
    console.log('- Title:', result.title ? 'OK' : 'VAZIO');
    console.log('- Introduction:', result.introduction ? 'OK' : 'VAZIO');
    console.log('- Methodology:', result.methodology ? 'OK' : 'VAZIO');
    console.log('- Results:', result.results ? 'OK' : 'VAZIO');
    console.log('- Conclusion:', result.conclusion ? 'OK' : 'VAZIO');
    console.log('- References:', result.references ? 'OK' : 'VAZIO');
    console.log('- Theoretical Topics:', result.theoreticalTopics?.length || 0);
    console.log('- Images:', result.images?.length || 0);
    
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
