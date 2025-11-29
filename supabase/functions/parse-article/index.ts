import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379";
import mammoth from "npm:mammoth@1.8.0";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const IMGBB_API_KEY = Deno.env.get("IMGBB_API_KEY");

interface ExtractedImage {
  id: string;
  base64: string;
  mimeType: string;
  position: number;
  contextText: string;
  url?: string;
}

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
    let extractedImages: ExtractedImage[] = [];

    // Processar baseado no tipo de arquivo
    if (file.type === 'application/pdf') {
      fullText = await parsePDF(fileBuffer);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      console.log('🔍 Iniciando extração de DOCX com imagens...');
      const result = await parseDOCXWithImages(fileBuffer);
      fullText = result.text;
      extractedImages = result.images;
      
      console.log(`📸 Total de imagens extraídas do DOCX: ${extractedImages.length}`);
      
      if (extractedImages.length > 0) {
        console.log('🔄 Iniciando upload das imagens para ImgBB...');
        console.log(`IMGBB_API_KEY configurada: ${IMGBB_API_KEY ? 'SIM' : 'NÃO'}`);
        
        // Upload das imagens para ImgBB
        for (let i = 0; i < extractedImages.length; i++) {
          const img = extractedImages[i];
          console.log(`📤 Tentando upload da imagem ${i + 1}/${extractedImages.length} (${img.id})...`);
          console.log(`   - Tamanho base64: ${img.base64.length} caracteres`);
          console.log(`   - Tipo MIME: ${img.mimeType}`);
          console.log(`   - Contexto: ${img.contextText.substring(0, 50)}...`);
          
          const url = await uploadToImgBB(img.base64, `article-${Date.now()}-${img.id}`);
          if (url) {
            img.url = url;
            console.log(`✅ Imagem ${img.id} uploadada com sucesso: ${url}`);
          } else {
            console.error(`❌ Falha ao fazer upload da imagem ${img.id}`);
          }
        }
        
        const uploadedCount = extractedImages.filter(img => img.url).length;
        console.log(`📊 Resultado final: ${uploadedCount}/${extractedImages.length} imagens uploadadas`);
      } else {
        console.log('⚠️ Nenhuma imagem encontrada no DOCX');
      }
    } else {
      throw new Error('Formato de arquivo não suportado. Use PDF ou DOCX.');
    }

    console.log('Texto extraído (primeiros 500 chars):', fullText.substring(0, 500));

    // Extrair seções do artigo usando IA
    const parsedContent = await extractArticleSectionsWithAI(fullText, extractedImages);

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

async function parseDOCXWithImages(buffer: ArrayBuffer): Promise<{ text: string; images: ExtractedImage[] }> {
  const extractedImages: ExtractedImage[] = [];
  
  console.log('🔍 Iniciando extração DOCX como ZIP...');
  console.log(`📦 Tamanho do buffer: ${buffer.byteLength} bytes`);
  
  // 1. Carregar DOCX como ZIP usando JSZip
  const zip = await JSZip.loadAsync(buffer);
  console.log('✅ DOCX carregado como ZIP');
  
  // 2. Extrair imagens de word/media/
  const mediaFiles = Object.keys(zip.files).filter(path => path.startsWith('word/media/'));
  console.log(`📸 Encontrados ${mediaFiles.length} arquivos em word/media/`);
  
  for (let i = 0; i < mediaFiles.length; i++) {
    const filePath = mediaFiles[i];
    const file = zip.files[filePath];
    
    if (file.dir) continue; // Pular diretórios
    
    console.log(`📷 Processando imagem ${i + 1}/${mediaFiles.length}: ${filePath}`);
    
    try {
      // Extrair como base64 diretamente do JSZip (método mais eficiente)
      const base64 = await file.async('base64');
      
      // Detectar extensão e tipo MIME
      const fileName = filePath.split('/').pop() || '';
      const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
      const mimeTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp'
      };
      const mimeType = mimeTypes[ext] || 'image/png';
      
      console.log(`   ✅ Imagem extraída: ${fileName} (${base64.length} chars base64, ${mimeType})`);
      
      extractedImages.push({
        id: fileName.replace(/\.[^.]+$/, ''), // Remove extensão
        base64: base64,
        mimeType: mimeType,
        position: i,
        contextText: `Imagem ${i + 1} do documento`
      });
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error);
    }
  }
  
  console.log(`📊 Total de ${extractedImages.length} imagens extraídas com sucesso`);
  
  // 3. Extrair texto usando mammoth
  console.log('📄 Extraindo texto com mammoth...');
  const uint8Array = new Uint8Array(buffer);
  const result = await mammoth.convertToHtml({ buffer: uint8Array });
  
  // Converter HTML para texto simples
  const textOnly = result.value
    .replace(/<[^>]+>/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`✅ Texto extraído: ${textOnly.length} caracteres`);
  
  return { text: textOnly, images: extractedImages };
}

async function uploadToImgBB(base64: string, filename: string): Promise<string | null> {
  if (!IMGBB_API_KEY) {
    console.error('❌ IMGBB_API_KEY não configurada');
    return null;
  }
  
  try {
    console.log(`🌐 Fazendo upload para ImgBB (filename: ${filename})...`);
    
    const formData = new FormData();
    formData.append('image', base64);
    formData.append('name', filename);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    console.log(`📡 Resposta ImgBB: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ Erro ImgBB:', response.status);
      const errorText = await response.text();
      console.error('Resposta de erro completa:', errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('📦 Dados retornados do ImgBB:', JSON.stringify(data).substring(0, 200));
    
    // Conforme documentação: data.data.url OU data.image.url
    if (data.success && data.data && data.data.url) {
      console.log('✅ Upload bem-sucedido! URL da imagem:', data.data.url);
      return data.data.url;
    } else if (data.image && data.image.url) {
      console.log('✅ Upload bem-sucedido! URL da imagem:', data.image.url);
      return data.image.url;
    } else {
      console.error('❌ ImgBB retornou sucesso=false ou sem URL da imagem');
      console.error('Estrutura completa:', JSON.stringify(data));
      return null;
    }
    
  } catch (error) {
    console.error('❌ Exceção ao fazer upload para ImgBB:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return null;
  }
}

async function extractArticleSectionsWithAI(text: string, images?: ExtractedImage[]) {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY não configurada, usando extração regex');
    return extractArticleSections(text);
  }

  try {
    let imagePromptPart = '';
    if (images && images.length > 0) {
      const imagesWithUrl = images.filter(img => img.url);
      if (imagesWithUrl.length > 0) {
        imagePromptPart = `\n\nIMAGENS EXTRAÍDAS DO DOCUMENTO (${imagesWithUrl.length} total):
${imagesWithUrl.map((img, i) => `
Imagem ${i + 1}:
- URL: ${img.url}
- Contexto onde aparece: "${img.contextText}"
`).join('')}

IMPORTANTE: Para cada imagem, identifique a seção onde deve aparecer (introduction, methodology, results, conclusion), o tipo ("figura", "grafico" ou "tabela"), a legenda e a fonte.`;
      }
    }
    
    const prompt = `Analise este artigo científico brasileiro e extraia TODAS as seções com PRECISÃO ABSOLUTA.${imagePromptPart}

REGRAS CRÍTICAS:
- **title**: Título completo em MAIÚSCULAS no INÍCIO do documento
- **authors**: Nomes APÓS o título com ¹ ou ² (ex: "Nome¹, Outro Nome²") - SEM instituições/e-mails
- **advisors**: Das notas de rodapé, extraia APENAS o nome de quem tem "Professor"
- **keywords**: Apenas palavras após "Palavras-chave:" - PARE antes de notas de rodapé
- **englishKeywords**: Apenas palavras após "Keywords:" - PARE antes de outras informações
- **theoreticalTopics**: Array com title e content de cada subtópico 2.1, 2.2, etc.
- **images**: Array com url, type, caption, source e section de cada imagem

TEXTO DO ARTIGO:
${text}`;

    // Usar Lovable AI com schema estruturado para garantir JSON válido
    const response = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Você é um extrator preciso de dados de artigos científicos brasileiros. Retorne APENAS JSON válido seguindo exatamente o schema fornecido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_article_sections',
                description: 'Extrai todas as seções de um artigo científico brasileiro',
                parameters: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Título completo do artigo' },
                    authors: { type: 'string', description: 'Nomes dos autores com ¹ ou ²' },
                    advisors: { type: 'string', description: 'Nome do orientador' },
                    abstract: { type: 'string', description: 'Resumo em português' },
                    keywords: { type: 'string', description: 'Palavras-chave em português' },
                    englishAbstract: { type: 'string', description: 'Abstract em inglês' },
                    englishKeywords: { type: 'string', description: 'Keywords em inglês' },
                    introduction: { type: 'string', description: 'Seção de introdução completa' },
                    theoreticalTopics: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          content: { type: 'string' }
                        },
                        required: ['title', 'content']
                      }
                    },
                    methodology: { type: 'string', description: 'Seção de metodologia completa' },
                    results: { type: 'string', description: 'Seção de resultados completa' },
                    conclusion: { type: 'string', description: 'Seção de conclusão completa' },
                    references: { type: 'string', description: 'Referências bibliográficas completas' },
                    images: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          url: { type: 'string' },
                          type: { type: 'string' },
                          caption: { type: 'string' },
                          source: { type: 'string' },
                          section: { type: 'string' }
                        },
                        required: ['url', 'type', 'caption', 'source', 'section']
                      }
                    }
                  },
                  required: ['title', 'authors', 'advisors', 'abstract', 'keywords', 'englishAbstract', 'englishKeywords', 'introduction', 'theoreticalTopics', 'methodology', 'results', 'conclusion', 'references']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'extract_article_sections' } }
        })
      }
    );

    if (!response.ok) {
      console.error('Erro na API Lovable AI:', response.status);
      const errorText = await response.text();
      console.error('Resposta de erro:', errorText);
      return extractArticleSections(text);
    }

    const data = await response.json();
    console.log('📊 Resposta Lovable AI recebida');
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('❌ Nenhum tool call retornado pela IA');
      return extractArticleSections(text);
    }
    
    const aiResult = JSON.parse(toolCall.function.arguments);
    console.log('✅ JSON parseado com sucesso via structured output');
    console.log('📋 Seções extraídas:', Object.keys(aiResult));

    // Converter para HTML
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
      references: cleanHtml(stripLeadingHeading(aiResult.references || '', REFERENCES_HEADING_PATTERNS)),
      institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
    };

    // Processar tópicos teóricos
    if (aiResult.theoreticalTopics && Array.isArray(aiResult.theoreticalTopics)) {
      result.theoreticalTopics = aiResult.theoreticalTopics.map((topic: any, index: number) => ({
        id: `topic-${index + 1}`,
        order: index + 1,
        title: topic.title || `Tópico ${index + 1}`,
        content: cleanHtml(topic.content || '')
      }));
    }

    // Processar imagens (usar URLs do ImgBB)
    if (aiResult.images && Array.isArray(aiResult.images)) {
      result.images = aiResult.images.map((img: any) => ({
        url: img.url || '',
        type: img.type || 'figura',
        caption: img.caption || '',
        source: img.source || 'Fonte: Documento original',
        section: img.section || 'results'
      }));
    }

    console.log('📊 Seções extraídas:');
    console.log('- Images:', result.images?.length || 0);
    
    return result;

  } catch (error) {
    console.error('Erro ao usar IA para extração:', error);
    return extractArticleSections(text);
  }
}

function extractArticleSections(text: string) {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  const extractBetween = (start: RegExp, end: RegExp): string => {
    const startMatch = cleanText.search(start);
    if (startMatch === -1) return '';
    
    const afterStart = cleanText.slice(startMatch);
    const endMatch = afterStart.search(end);
    
    if (endMatch === -1) return afterStart.replace(start, '').trim();
    
    return afterStart.slice(0, endMatch).replace(start, '').trim();
  };

  const titleMatch = cleanText.match(/(?:Campus\s+[^\n]+\s+)([A-ZÀÂÃÉÊÍÓÔÕÚÇ\s]{20,150}?)(?:\s+[A-Z][a-z]|\s+RESUMO)/);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const authorsMatch = cleanText.match(/([A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ]\.?\s+)?[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+)*¹?)(?:\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+(?:\s+[A-ZÀÂÃÉÊÍÓÔÕÚÇ]\.?\s+)?[A-ZÀÂÃÉÊÍÓÔÕÚÇ][a-zàâãéêíóôõúç]+²?)?/);
  const authors = authorsMatch ? authorsMatch[0].trim() : '';

  const advisorMatch = cleanText.match(/(?:Professor|Orientador|Mestre|Doutor)[^.]+\.(?:\s+Professor[^.]+\.)?/i);
  const advisors = advisorMatch ? advisorMatch[0].trim() : '';

  const abstract = extractBetween(/RESUMO\s*/i, /Palavras-chave:/i);
  const keywordsMatch = cleanText.match(/Palavras-chave:\s*([^.]+(?:\.[^.]+){2,}\.)/i);
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';

  const englishAbstract = extractBetween(/ABSTRACT\s*/i, /Keywords:/i);
  const englishKeywordsMatch = cleanText.match(/Keywords:\s*([^.]+(?:\.[^.]+){2,}\.)/i);
  const englishKeywords = englishKeywordsMatch ? englishKeywordsMatch[1].trim() : '';

  const introduction = extractBetween(/1\.?\s*INTRODUÇÃO/i, /2\.?\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ]/);
  const methodology = extractBetween(/(?:3|4)\.?\s*(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MÉTODO)/i, /(?:4|5)\.?\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ]/);
  const results = extractBetween(/(?:4|5)\.?\s*(?:RESULTADOS?|DISCUSSÃO|ANÁLISE)/i, /(?:5|6)\.?\s*(?:CONCLUS|CONSIDER)/i);
  const conclusion = extractBetween(/(?:5|6)\.?\s*(?:CONCLUS|CONSIDER)/i, /REFERÊNCIAS/i);
  const references = cleanText.split(/REFERÊNCIAS\s*BIBLIOGRÁFICAS|REFERÊNCIAS/i)[1]?.trim() || '';

  return {
    title: cleanHtml(title),
    authors: cleanHtml(authors),
    advisors: cleanHtml(advisors),
    abstract: cleanHtml(abstract),
    keywords: cleanHtml(keywords),
    englishAbstract: cleanHtml(englishAbstract),
    englishKeywords: cleanHtml(englishKeywords),
    introduction: cleanHtml(introduction),
    theoreticalTopics: [],
    methodology: cleanHtml(methodology),
    results: cleanHtml(results),
    conclusion: cleanHtml(conclusion),
    references: cleanHtml(references),
    institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
  };
}

function cleanHtml(text: string): string {
  if (!text) return '';
  
  // Normalizar quebras de linha
  let normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ');
  
  // Dividir em parágrafos usando quebras duplas
  const paragraphs = normalized
    .split(/\n\n+/)  // Quebras duplas ou mais = novos parágrafos
    .map(para => {
      // Dentro de cada parágrafo, substituir quebras simples por espaços
      return para
        .replace(/\n/g, ' ')  // Quebra simples vira espaço
        .replace(/\s+/g, ' ')  // Múltiplos espaços viram um
        .trim();
    })
    .filter(para => para.length > 0);  // Remove parágrafos vazios
  
  // Converter para HTML com tags <p>
  return paragraphs.map(para => `<p>${para}</p>`).join('');
}

const INTRO_HEADING_PATTERNS = [
  /^1\.?\s*INTRODUÇÃO\s*/i,
  /^INTRODUÇÃO\s*/i,
  /^1\.?\s*Introdução\s*/i,
  /^Introdução\s*/i
];

const METHODOLOGY_HEADING_PATTERNS = [
  /^(?:3|4)\.?\s*METODOLOGIA\s*/i,
  /^METODOLOGIA\s*/i,
  /^(?:3|4)\.?\s*Metodologia\s*/i,
  /^Metodologia\s*/i,
  /^(?:3|4)\.?\s*MATERIAIS?\s+E\s+MÉTODOS\s*/i,
  /^MATERIAIS?\s+E\s+MÉTODOS\s*/i
];

const RESULTS_HEADING_PATTERNS = [
  /^(?:4|5)\.?\s*RESULTADOS?\s*(E\s*DISCUSS[ÃA]O)?\s*/i,
  /^RESULTADOS?\s*(E\s*DISCUSS[ÃA]O)?\s*/i,
  /^(?:4|5)\.?\s*Resultados?\s*(e\s*Discussão)?\s*/i,
  /^Resultados?\s*(e\s*Discussão)?\s*/i
];

const CONCLUSION_HEADING_PATTERNS = [
  /^(?:5|6)\.?\s*CONCLUS[ÕO]ES?\s*/i,
  /^CONCLUS[ÕO]ES?\s*/i,
  /^(?:5|6)\.?\s*CONSIDERA[ÇC][ÕO]ES\s+FINAIS\s*/i,
  /^CONSIDERA[ÇC][ÕO]ES\s+FINAIS\s*/i
];

const REFERENCES_HEADING_PATTERNS = [
  /^REFERÊNCIAS\s*BIBLIOGRÁFICAS\s*/i,
  /^REFERÊNCIAS\s*/i,
  /^Referências\s*Bibliográficas\s*/i,
  /^Referências\s*/i
];

function stripLeadingHeading(text: string, patterns: RegExp[]): string {
  if (!text) return '';
  for (const pattern of patterns) {
    text = text.replace(pattern, '');
  }
  return text.trim();
}
