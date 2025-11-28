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
    
    const prompt = `Analise este artigo científico brasileiro e extraia TODAS as seções com PRECISÃO ABSOLUTA.${imagePromptPart}

EXEMPLO REAL DO DOCUMENTO QUE VOCÊ VAI PROCESSAR:
- Título: "APLICAÇÃO DA INTELIGÊNCIA ARTIFICIAL NO PROCESSO DE ORIENTAÇÃO ACADÊMICA: UM ESTUDO SOBRE TCCS"
- Autores (após título, ANTES do resumo): "Rangel Gomes Soares da Silva¹" E "Alex F. de Araujo²"
- Notas de rodapé:
  * ¹ Tecnólogo em Análise e Desenvolvimento de Sistemas. Instituto Federal de Mato Grosso do Sul...
  * ² Mestre em Ciências da Computação... Professor no Instituto Federal de Mato Grosso do Sul...
- Palavras-chave (após resumo): "Tecnologia Educacional, Teoria do Andaime, Escrita Científica, Pesquisa-Ação, Inteligência Artificial."
- Keywords (após abstract): "Educational Technology, Scaffolding Theory, Scientific Writing, Action Research, Artificial Intelligence"

REGRAS ABSOLUTAS DE EXTRAÇÃO:

**title**: 
  - Título completo em MAIÚSCULAS que aparece no INÍCIO do documento
  - Exemplo correto: "APLICAÇÃO DA INTELIGÊNCIA ARTIFICIAL NO PROCESSO DE ORIENTAÇÃO ACADÊMICA: UM ESTUDO SOBRE TCCS"

**authors**: 
  - Nomes que aparecem IMEDIATAMENTE APÓS o título e ANTES de "RESUMO"
  - Com superscript ¹ ou ²
  - Formato: "Nome Completo¹, Outro Nome²" (separados por vírgula ou quebra de linha)
  - EXEMPLO: "Rangel Gomes Soares da Silva¹, Alex F. de Araujo²"
  - NÃO INCLUA: instituições, e-mails, cargos

**advisors**: 
  - PROCURE nas notas de rodapé (¹, ²) por quem tem "Professor" ou "Mestre" ou "Doutor"
  - EXTRAIA APENAS O NOME da pessoa (primeira parte antes das qualificações)
  - Se a nota diz "² Mestre em... Professor no Instituto...", extraia apenas "Alex F. de Araujo"
  - Se houver 2 autores (¹ e ²), geralmente o ² é o orientador
  - Formato esperado: "Nome Completo" (sem cargos, sem instituição)

**abstract**: 
  - Todo o parágrafo após "RESUMO" até a linha "Palavras-chave:"
  - NÃO INCLUA a linha "Palavras-chave:" nem o que vem depois

**keywords**: 
  - SOMENTE as palavras que vêm IMEDIATAMENTE após "Palavras-chave:"
  - Pare ANTES de qualquer nota de rodapé (¹, ²)
  - EXEMPLO CORRETO: "Tecnologia Educacional, Teoria do Andaime, Escrita Científica, Pesquisa-Ação, Inteligência Artificial"
  - NÃO INCLUA: "¹ Tecnólogo..." ou e-mails ou datas

**englishAbstract**: 
  - Todo o texto após "ABSTRACT" até a linha "Keywords:"
  - NÃO INCLUA "Keywords:" nem o que vem depois

**englishKeywords**: 
  - SOMENTE as palavras após "Keywords:"
  - Pare ANTES de "Data de aprovação:" ou qualquer outra informação
  - EXEMPLO CORRETO: "Educational Technology, Scaffolding Theory, Scientific Writing, Action Research, Artificial Intelligence"

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

VERIFICAÇÃO FINAL - VOCÊ DEVE:
1. Verificar se "authors" contém APENAS nomes com ¹ ou ² (ex: "Rangel Gomes Soares da Silva¹, Alex F. de Araujo²")
2. Verificar se "advisors" contém APENAS o nome extraído da nota de rodapé que menciona "Professor" (ex: "Alex F. de Araujo")
3. Verificar se "keywords" NÃO contém notas de rodapé, e-mails ou qualquer texto que não seja palavra-chave
4. Verificar se "englishKeywords" NÃO contém "Data de aprovação" ou qualquer texto adicional
5. Se algum campo estiver com informações extras, LIMPE e deixe APENAS o conteúdo correto

TEXTO DO ARTIGO:
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
          { role: 'system', content: 'Você é um extrator de dados de artigos científicos brasileiros. Seja EXTREMAMENTE PRECISO. REGRAS ABSOLUTAS: 1) "authors": APENAS nomes após o título com ¹ ou ², NUNCA inclua notas de rodapé. 2) "advisors": Das notas de rodapé, extraia APENAS o nome completo de quem tem "Professor" (ex: de "² Mestre... Professor no IFMS" extraia só "Alex F. de Araujo"). 3) "keywords": APENAS palavras após "Palavras-chave:", PARE antes de qualquer ¹. 4) "englishKeywords": APENAS keywords, PARE antes de "Data de aprovação". 5) Retorne JSON puro sem markdown.' },
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
    
    console.log('Resposta da IA (primeiros 500 chars):', content.substring(0, 500));
    console.log('Resposta da IA (últimos 500 chars):', content.substring(content.length - 500));
    
    // Encontrar o JSON válido entre { e }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('JSON não encontrado na resposta da IA');
      return extractArticleSections(text);
    }
    
    let jsonStr = content.substring(firstBrace, lastBrace + 1);
    
    // Remover caracteres de controle problemáticos mas preservar \n válidos
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    let aiResult;
    try {
      aiResult = JSON.parse(jsonStr);
      console.log('✅ JSON parseado com sucesso');
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('JSON problemático (primeiros 500 chars):', jsonStr.substring(0, 500));
      return extractArticleSections(text);
    }

    // Converter para HTML e adicionar instituição padrão
    const result: any = {
      title: cleanHtml(aiResult.title || ''),
      authors: cleanHtml(aiResult.authors || ''),
      advisors: cleanHtml(aiResult.advisors || ''),
      abstract: cleanHtml(aiResult.abstract || ''),
      keywords: cleanHtml(aiResult.keywords || ''),
      englishAbstract: cleanHtml(aiResult.englishAbstract || ''),
      englishKeywords: cleanHtml(aiResult.englishKeywords || ''),
      introduction: cleanHtml(stripLeadingHeading(aiResult.introduction || '', INTRO_HEADING_PATTERNS)),
      methodology: cleanHtml(stripLeadingHeading(aiResult.methodology || '', METHODOLOGY_HEADING_PATTERNS)),
      results: cleanHtml(stripLeadingHeading(aiResult.results || '', RESULTS_HEADING_PATTERNS)),
      conclusion: cleanHtml(stripLeadingHeading(aiResult.conclusion || '', CONCLUSION_HEADING_PATTERNS)),
      // Remove possíveis cabeçalhos duplicados como "REFERÊNCIAS" do início do conteúdo
      references: cleanHtml(stripLeadingHeading(aiResult.references || '', REFERENCES_HEADING_PATTERNS)),
      institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
    };
    
    console.log('📊 Seções extraídas com sucesso:');
    console.log('- Title:', result.title ? 'OK' : 'VAZIO');
    console.log('- Authors:', result.authors ? 'OK' : 'VAZIO');
    console.log('- Introduction:', result.introduction ? `OK (${result.introduction.length} chars)` : '❌ VAZIO');
    console.log('- Methodology:', result.methodology ? 'OK' : 'VAZIO');
    console.log('- Results:', result.results ? 'OK' : 'VAZIO');
    console.log('- Conclusion:', result.conclusion ? 'OK' : 'VAZIO');
    console.log('- References:', result.references ? 'OK' : 'VAZIO');
    
    if (!result.introduction) {
      console.log('⚠️ Introdução vazia - verificando dados brutos da IA:');
      console.log('aiResult.introduction (primeiros 200 chars):', (aiResult.introduction || '').substring(0, 200));
      console.log('aiResult.introduction (length):', (aiResult.introduction || '').length);
    }

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
    introduction: cleanHtml(stripLeadingHeading(introduction, INTRO_HEADING_PATTERNS)),
    methodology: cleanHtml(stripLeadingHeading(methodology, METHODOLOGY_HEADING_PATTERNS)),
    results: cleanHtml(stripLeadingHeading(results, RESULTS_HEADING_PATTERNS)),
    conclusion: cleanHtml(stripLeadingHeading(conclusion, CONCLUSION_HEADING_PATTERNS)),
    references: cleanHtml(stripLeadingHeading(references, REFERENCES_HEADING_PATTERNS)),
    institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
  };
}

function cleanHtml(text: string): string {
  if (!text) return '';
  
  // Preservar quebras de linha convertendo para <br> primeiro
  let processed = text.replace(/\n/g, '<br>');
  
  // Converter duplas quebras em parágrafos
  const paragraphs = processed
    .split(/<br><br>/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Se já tem tags HTML, retorna como está
      if (/<[a-z][\s\S]*>/i.test(p)) return p;
      // Senão, envolve em <p>
      return `<p>${p}</p>`;
    })
    .join('');
  
  return paragraphs || `<p>${text}</p>`;
}

// Padrões para remover cabeçalhos duplicados no início das seções
const INTRO_HEADING_PATTERNS = [
  /^(\s*\d+(\.\d+)*\s+)?INTRODU[ÇC][ÃA]O[:\s-]*/i,
];

const METHODOLOGY_HEADING_PATTERNS = [
  /^(\s*\d+(\.\d+)*\s+)?(METODOLOGIA|MATERIAIS E M[ÉE]TODOS|PROCEDIMENTOS METODOL[ÓO]GICOS|M[ÉE]TODO)[:\s-]*/i,
];

const RESULTS_HEADING_PATTERNS = [
  /^(\s*\d+(\.\d+)*\s+)?(RESULTADOS(?:\s+E\s+DISCUSS[ÃA]O(?:ES)?)?|AN[ÁA]LISE\s+DOS\s+RESULTADOS|DISCUSS[ÃA]O|AN[ÁA]LISE\s+E\s+DISCUSS[ÃA]O\s+DOS\s+RESULTADOS)[:\s-]*/i,
];

const CONCLUSION_HEADING_PATTERNS = [
  /^(\s*\d+(\.\d+)*\s+)?(CONCLUS[ÃA]O(?:ES)?|CONSIDERA[ÇC][ÕO]ES\s+FINAIS|CONCLUS[ÕO]ES\s+E\s+CONSIDERA[ÇC][ÕO]ES\s+FINAIS)[:\s-]*/i,
];

const REFERENCES_HEADING_PATTERNS = [
  /^REFER[ÊE]NCIAS?(?:\s+BIBLIOGR[ÁA]FICAS?)?[:\s-]*/i,
];

const TOPIC_HEADING_PATTERNS = [
  /^\s*\d+(\.\d+)+\s+[^\n:]+[:\s-]*/i,
];

// Remove cabeçalhos duplicados no início de seções (ex: "REFERÊNCIAS")
function stripLeadingHeading(text: string, patterns: RegExp[]): string {
  if (!text) return '';
  let cleaned = text.trimStart();

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match.index === 0) {
      cleaned = cleaned.slice(match[0].length).trimStart();
      break;
    }
  }

  return cleaned;
}
