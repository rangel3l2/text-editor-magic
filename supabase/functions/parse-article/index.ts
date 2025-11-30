import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379";
import mammoth from "npm:mammoth@1.8.0";
import JSZip from "npm:jszip@3.10.1";
import { createGeminiClient } from "../_shared/geminiClient.ts";

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

// Extração híbrida: código para seções padrão, IA para tópicos teóricos variáveis
async function extractArticleSectionsWithAI(text: string, images?: ExtractedImage[]) {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY não configurada, usando extração regex');
    return extractArticleSections(text);
  }

  try {
    console.log('🔍 ESTÁGIO 1: Extraindo seções padrão IFMS com código...');
    
    // ESTÁGIO 1: Extrair seções padrão com regex (rápido e preciso)
    const standardSections = extractStandardIFMSSections(text);
    
    console.log('✅ Seções padrão extraídas:', {
      title: standardSections.title ? 'OK' : 'VAZIO',
      authors: standardSections.authors ? 'OK' : 'VAZIO',
      abstract: standardSections.abstract ? 'OK' : 'VAZIO',
      keywords: standardSections.keywords ? 'OK' : 'VAZIO',
      introduction: standardSections.introduction ? 'OK' : 'VAZIO',
      methodology: standardSections.methodology ? 'OK' : 'VAZIO',
      results: standardSections.results ? 'OK' : 'VAZIO',
      conclusion: standardSections.conclusion ? 'OK' : 'VAZIO',
      references: standardSections.references ? 'OK' : 'VAZIO',
    });

    console.log('🤖 ESTÁGIO 2: Identificando tópicos teóricos para IA...');
    
    // ESTÁGIO 2: Identificar apenas os tópicos teóricos (seções entre Introdução e Metodologia)
    const theoreticalSectionsText = extractTheoreticalSectionsText(text);
    
    if (!theoreticalSectionsText) {
      console.log('⚠️ Nenhum tópico teórico encontrado entre Introdução e Metodologia');
      return {
        ...standardSections,
        theoreticalTopics: [],
        images: [],
        institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
      };
    }

    console.log('📝 Texto dos tópicos teóricos (primeiros 200 chars):', theoreticalSectionsText.substring(0, 200));

    // Preparar prompt de imagens se necessário
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

    // Prompt focado apenas nos tópicos teóricos
    const prompt = `Analise APENAS os tópicos teóricos deste artigo IFMS e extraia em JSON.${imagePromptPart}

TÓPICOS TEÓRICOS (seções numeradas entre Introdução e Metodologia):
${theoreticalSectionsText}

TAREFA:
Identifique TODAS as seções numeradas neste texto e extraia:
- O título de cada seção (sem o número)
- O conteúdo completo de cada seção (até a próxima seção numerada)

REGRAS:
- NUNCA use blocos markdown
- Responda APENAS com JSON válido
- Use aspas simples dentro dos textos, não aspas duplas
- Cada tópico teórico PARA quando encontrar a próxima seção numerada

FORMATO DE RESPOSTA:
{
  "theoreticalTopics": [
    { "title": "título da seção 1", "content": "conteúdo completo da seção 1" },
    { "title": "título da seção 2", "content": "conteúdo completo da seção 2" }
  ],
  "images": [
    {
      "url": "...",
      "type": "figura" | "grafico" | "tabela",
      "caption": "...",
      "source": "...",
      "section": "introduction" | "methodology" | "results" | "conclusion"
    }
  ]
}`;

    console.log('🔎 Chamando Gemini apenas para tópicos teóricos...');
    const client = createGeminiClient();
    const aiResponse = await client.generateContent(prompt);
    let rawText = aiResponse.response.text();

    console.log('📥 Resposta bruta do Gemini (primeiros 400 chars):', rawText.substring(0, 400));

    // Limpar blocos markdown
    rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    console.log('🧹 Texto limpo (primeiros 400 chars):', rawText.substring(0, 400));

    let aiResult: any;

    try {
      aiResult = JSON.parse(rawText);
      console.log('✅ JSON parseado com sucesso diretamente');
    } catch (parseError) {
      console.error('❌ Falha ao fazer JSON.parse direto da resposta do Gemini:', parseError);

      // Tentar recuperar apenas o trecho entre o primeiro "{" e o último "}"
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonSlice = rawText.slice(firstBrace, lastBrace + 1);
        try {
          aiResult = JSON.parse(jsonSlice);
          console.log('✅ JSON parseado com sucesso a partir de slice da resposta do Gemini');
        } catch (sliceError) {
          console.error('❌ Também falhou ao parsear slice JSON da resposta do Gemini:', sliceError);
          console.error('❌ Conteúdo do slice que falhou:', jsonSlice.substring(0, 500));
          return extractArticleSections(text);
        }
      } else {
        console.error('❌ Resposta do Gemini não contém bloco JSON claro, voltando para regex');
        return extractArticleSections(text);
      }
    }

    if (!aiResult || typeof aiResult !== 'object') {
      console.error('❌ Resultado do Gemini não é um objeto esperado, voltando para regex');
      return extractArticleSections(text);
    }

    console.log('📋 Tópicos teóricos extraídos pela IA (chaves):', Object.keys(aiResult));

    // ESTÁGIO 3: Combinar seções padrão (código) + tópicos teóricos (IA)
    const result: any = {
      ...standardSections,
      institution: 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul',
    };

    // Processar tópicos teóricos da IA
    if (aiResult.theoreticalTopics && Array.isArray(aiResult.theoreticalTopics)) {
      result.theoreticalTopics = aiResult.theoreticalTopics.map((topic: any, index: number) => ({
        id: `topic-${index + 1}`,
        order: index + 1,
        title: topic.title || `Tópico ${index + 1}`,
        content: cleanHtml(topic.content || ''),
      }));
    } else {
      result.theoreticalTopics = [];
    }

    // Processar imagens
    if (aiResult.images && Array.isArray(aiResult.images)) {
      result.images = aiResult.images.map((img: any) => ({
        url: img.url || '',
        type: img.type || 'figura',
        caption: img.caption || '',
        source: img.source || 'Fonte: Documento original',
        section: img.section || 'results',
      }));
    } else {
      result.images = [];
    }

    console.log('📊 Extração híbrida completa:');
    console.log('- Título:', result.title ? 'OK' : 'VAZIO');
    console.log('- Tópicos teóricos:', result.theoreticalTopics?.length || 0);
    console.log('- Imagens:', result.images?.length || 0);

    return result;
  } catch (error) {
    console.error('Erro ao usar Gemini para extração estruturada:', error);
    return extractArticleSections(text);
  }
}

// ESTÁGIO 1: Extração de seções padrão IFMS usando código (rápido e preciso)
function extractStandardIFMSSections(text: string) {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  const extractBetween = (start: RegExp, end: RegExp): string => {
    const startMatch = cleanText.search(start);
    console.log(`🔎 Buscando padrão ${start}: posição = ${startMatch}`);
    if (startMatch === -1) return '';
    
    const afterStart = cleanText.slice(startMatch);
    const endMatch = afterStart.search(end);
    console.log(`🔎 Buscando fim ${end}: posição = ${endMatch}`);
    
    if (endMatch === -1) {
      const extracted = afterStart.replace(start, '').trim();
      console.log(`✂️ Extraído até o fim (${extracted.length} chars): ${extracted.substring(0, 100)}...`);
      return extracted;
    }
    
    const extracted = afterStart.slice(0, endMatch).replace(start, '').trim();
    console.log(`✂️ Extraído (${extracted.length} chars): ${extracted.substring(0, 100)}...`);
    return extracted;
  };

  // Extrair título e subtítulo seguindo padrão ABNT
  // Padrão ABNT: "TÍTULO PRINCIPAL: subtítulo complementar"
  // Título principal: em CAIXA ALTA
  // Subtítulo: após dois pontos, pode estar em caixa mista
  console.log('\n📖 Extraindo TÍTULO e SUBTÍTULO (padrão ABNT)...');
  
  // Buscar título completo (pode ter ou não subtítulo)
  const fullTitleMatch = cleanText.match(/(?:Campus\s+[^\n]+\s+)?([A-ZÀÂÃÉÊÍÓÔÕÚÇ\s:]{15,200}?)(?:\s+[A-Z][a-z]|\s+RESUMO)/);
  const fullTitle = fullTitleMatch ? fullTitleMatch[1].trim() : '';
  
  let title = '';
  let subtitle = '';
  
  if (fullTitle) {
    // Verificar se há dois pontos separando título e subtítulo
    if (fullTitle.includes(':')) {
      const parts = fullTitle.split(':');
      title = parts[0].trim();
      subtitle = parts.slice(1).join(':').trim(); // Caso tenha mais de um ":"
      console.log('📌 Título principal extraído:', `"${title}"`);
      console.log('📌 Subtítulo extraído:', `"${subtitle}"`);
    } else {
      // Sem subtítulo, apenas título
      title = fullTitle;
      console.log('📌 Título extraído (sem subtítulo):', `"${title.substring(0, 50)}..."`);
    }
  } else {
    console.log('⚠️ Título não encontrado');
  }

  // Extrair autores seguindo padrão IFMS
  // ATENÇÃO: versão simplificada temporária para não quebrar o boot da função.
  console.log('\n📖 Extraindo AUTORES (padrão IFMS - versão simples)...');
  
  let authors = '';
  let authorsWithFootnotes = '';
  let studentName = '';
  let advisorName = '';
  
  try {
    // Versão mínima: apenas registra que a extração detalhada ainda será refinada
    console.log('⚠️ Extração detalhada de autores/footnotes desativada temporariamente.');
  } catch (e) {
    console.error('Erro na extração simplificada de autores:', e);
  }
  
  console.log('✅ Autores completos (primeiros 150 chars):', authorsWithFootnotes ? `"${authorsWithFootnotes.substring(0, 150)}..."` : 'VAZIO');
  
  // Extrair orientadores (notas de rodapé com "Professor")
  const advisorMatch = cleanText.match(/(?:Professor|Orientador|Mestre|Doutor)[^.]+\.(?:\s+Professor[^.]+\.)?/i);
  const advisors = advisorMatch ? advisorMatch[0].trim() : '';
  console.log('📌 Orientadores extraídos:', advisors ? `"${advisors.substring(0, 50)}..."` : 'VAZIO');
  
  // Extrair RESUMO (até "Palavras-chave:")
  console.log('\n📖 Extraindo ELEMENTOS PRÉ-TEXTUAIS com IA...');
  
  // Delimitar seção pré-textual: entre fim dos autores (incluindo footnotes) e introdução
  const preTextAuthorsIndex = cleanText.indexOf(authors);
  const preTextResumoIndex = cleanText.indexOf('RESUMO', preTextAuthorsIndex);
  const preTextIntroIndex = cleanText.search(/1\.?\s*INTRODUÇÃO/i);
  
  // Seção pré-textual = do RESUMO até antes da INTRODUÇÃO
  const preTextualSection = (preTextResumoIndex !== -1 && preTextIntroIndex !== -1)
    ? cleanText.substring(preTextResumoIndex, preTextIntroIndex).trim()
    : '';
  
  // Usar IA para classificar elementos pré-textuais
  let abstract = '';
  let keywords = '';
  let englishAbstract = '';
  let englishKeywords = '';
  
  if (preTextualSection && GEMINI_API_KEY) {
    try {
      console.log('🤖 Enviando elementos pré-textuais para Gemini classificar...');
      
      const classificationResponse = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Você é um especialista em estruturação de artigos científicos seguindo o padrão IFMS (Instituto Federal de Mato Grosso do Sul).

Analise o texto abaixo, que contém elementos pré-textuais de um artigo científico, e identifique onde cada parte deve ser colocada seguindo o padrão IFMS:

TEXTO PRÉ-TEXTUAL:
${preTextualSection}

CAMPOS DISPONÍVEIS (padrão IFMS):
1. "resumo" - Resumo em português (texto corrido, sem marcadores)
2. "palavrasChave" - Palavras-chave em português (separadas por ponto)
3. "abstract" - Abstract em inglês (texto corrido, sem marcadores)
4. "keywords" - Keywords em inglês (separadas por ponto)

REGRAS:
- Identifique cada bloco de texto e classifique-o no campo correto
- Se um campo não for encontrado, deixe vazio
- O resumo e abstract são textos corridos (parágrafos)
- Palavras-chave e keywords são listas separadas por ponto
- Remova títulos das seções (como "RESUMO:", "Palavras-chave:", "ABSTRACT:", "Keywords:")
- Retorne APENAS o conteúdo, sem os títulos das seções`
              }]
            }],
            tools: [{
              functionDeclarations: [{
                name: 'classify_pretextual_elements',
                description: 'Classifica elementos pré-textuais do artigo em seus campos corretos',
                parameters: {
                  type: 'object',
                  properties: {
                    resumo: { 
                      type: 'string',
                      description: 'Resumo em português (texto corrido, sem título "RESUMO")'
                    },
                    palavrasChave: { 
                      type: 'string',
                      description: 'Palavras-chave em português separadas por ponto (sem título "Palavras-chave:")'
                    },
                    abstract: { 
                      type: 'string',
                      description: 'Abstract em inglês (texto corrido, sem título "ABSTRACT")'
                    },
                    keywords: { 
                      type: 'string',
                      description: 'Keywords em inglês separadas por ponto (sem título "Keywords:")'
                    }
                  },
                  required: ['resumo', 'palavrasChave', 'abstract', 'keywords']
                }
              }]
            }],
            toolConfig: {
              functionCallingConfig: {
                mode: 'ANY',
                allowedFunctionNames: ['classify_pretextual_elements']
              }
            }
          }),
        }
      );
      
      if (!classificationResponse.ok) {
        const errorText = await classificationResponse.text();
        console.error('❌ Erro na classificação Gemini:', classificationResponse.status, errorText);
      } else {
        const classificationData = await classificationResponse.json();
        console.log('✅ Resposta Gemini recebida');
        
        const functionCall = classificationData.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        
        if (functionCall?.name === 'classify_pretextual_elements' && functionCall.args) {
          abstract = functionCall.args.resumo || '';
          keywords = functionCall.args.palavrasChave || '';
          englishAbstract = functionCall.args.abstract || '';
          englishKeywords = functionCall.args.keywords || '';
          
          console.log('📌 Resumo classificado:', abstract ? `${abstract.substring(0, 50)}...` : 'VAZIO');
          console.log('📌 Palavras-chave classificadas:', keywords ? `${keywords.substring(0, 50)}...` : 'VAZIO');
          console.log('📌 Abstract classificado:', englishAbstract ? `${englishAbstract.substring(0, 50)}...` : 'VAZIO');
          console.log('📌 Keywords classificadas:', englishKeywords ? `${englishKeywords.substring(0, 50)}...` : 'VAZIO');
        } else {
          console.error('❌ Resposta Gemini não contém function call esperado');
        }
      }
    } catch (aiError) {
      console.error('❌ Erro ao classificar elementos pré-textuais com IA:', aiError);
      // Fallback para extração regex se IA falhar
      abstract = extractBetween(/RESUMO\s*/i, /Palavras-chave:/i);
      const keywordsMatch = cleanText.match(/Palavras-chave:\s*([^.]+(?:\.[^.]+){0,10}?)(?=\s*(?:ABSTRACT|1\s+INTRODUÇÃO|$))/i);
      keywords = keywordsMatch ? keywordsMatch[1].trim() : '';
      englishAbstract = extractBetween(/ABSTRACT\s*/i, /Keywords:/i);
      const englishKeywordsMatch = cleanText.match(/Keywords:\s*([^.]+(?:\.[^.]+){0,10}?)(?=\s*(?:1\s+INTRODUÇÃO|$))/i);
      englishKeywords = englishKeywordsMatch ? englishKeywordsMatch[1].trim() : '';
    }
  } else {
    // Fallback: extração regex tradicional se não houver API key ou seção pré-textual
    console.log('⚠️ Usando extração regex (fallback)');
    abstract = extractBetween(/RESUMO\s*/i, /Palavras-chave:/i);
    const keywordsMatch = cleanText.match(/Palavras-chave:\s*([^.]+(?:\.[^.]+){0,10}?)(?=\s*(?:ABSTRACT|1\s+INTRODUÇÃO|$))/i);
    keywords = keywordsMatch ? keywordsMatch[1].trim() : '';
    englishAbstract = extractBetween(/ABSTRACT\s*/i, /Keywords:/i);
    const englishKeywordsMatch = cleanText.match(/Keywords:\s*([^.]+(?:\.[^.]+){0,10}?)(?=\s*(?:1\s+INTRODUÇÃO|$))/i);
    englishKeywords = englishKeywordsMatch ? englishKeywordsMatch[1].trim() : '';
  }

  // Extrair INTRODUÇÃO (seção 1 até seção 2)
  console.log('\n📖 Extraindo INTRODUÇÃO...');
  const introduction = extractBetween(/1\.?\s*INTRODUÇÃO/i, /2\.?\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ]/);

  // Buscar METODOLOGIA com múltiplos padrões (incluindo subseções e nomes alternativos)
  console.log('\n📖 Buscando METODOLOGIA (múltiplos padrões)...');
  let methodology = '';
  let methodologyEndPattern: RegExp | null = null;
  
  // Padrão 1: Seção numerada "X METODOLOGIA"
  const methodologyMatch1 = cleanText.match(/(\d+)\.?\s*METODOLOGIA/i);
  // Padrão 2: Subseção "X.Y METODOLOGIA" ou "X.Y MATERIAIS E MÉTODOS"
  const methodologyMatch2 = cleanText.match(/(\d+)\.(\d+)\s*(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MATERIAIS?\s+DE\s+DESENVOLVIMENTO)/i);
  // Padrão 3: Seção sem número "METODOLOGIA"
  const methodologyMatch3 = cleanText.match(/(?:^|\n)\s*(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MÉTODO)\s*(?:\n|$)/i);
  
  if (methodologyMatch1) {
    console.log('✅ Encontrou METODOLOGIA como seção principal:', methodologyMatch1[0]);
    const methodologyNumber = parseInt(methodologyMatch1[1]);
    methodology = extractBetween(
      new RegExp(`${methodologyNumber}\\.?\\s*METODOLOGIA`, 'i'),
      /(?:RESULTADOS?|DISCUSS[ÃO]|ANÁLISE|CONCLUS|CONSIDER|REFERÊNCIAS)/i
    );
  } else if (methodologyMatch2) {
    console.log('✅ Encontrou METODOLOGIA como subseção:', methodologyMatch2[0]);
    methodology = extractBetween(
      new RegExp(`${methodologyMatch2[1]}\\.${methodologyMatch2[2]}\\s*(?:METODOLOGIA|MATERIAIS?\\s+E\\s+MÉTODOS|MATERIAIS?\\s+DE\\s+DESENVOLVIMENTO)`, 'i'),
      /(?:RESULTADOS?|DISCUSS[ÃO]|ANÁLISE|CONCLUS|CONSIDER|REFERÊNCIAS)/i
    );
  } else if (methodologyMatch3) {
    console.log('✅ Encontrou METODOLOGIA sem número:', methodologyMatch3[0]);
    methodology = extractBetween(
      /(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MÉTODO)\s*/i,
      /(?:RESULTADOS?|DISCUSS[ÃO]|ANÁLISE|CONCLUS|CONSIDER|REFERÊNCIAS)/i
    );
  } else {
    console.log('⚠️ METODOLOGIA não encontrada com nenhum padrão');
  }

  // Buscar RESULTADOS (com ou sem número)
  console.log('\n📖 Buscando RESULTADOS...');
  const results = extractBetween(
    /(?:\d+\.?\s*)?(?:RESULTADOS?|DISCUSS[ÕÃ]ES?)\s*(?:E\s*DISCUSS[ÕÃ]ES?)?/i,
    /(?:CONCLUS|CONSIDERA[ÇC][ÕÃ]ES|REFERÊNCIAS)/i
  );

  // Buscar CONCLUSÃO (com ou sem número)
  console.log('\n📖 Buscando CONCLUSÃO...');
  const conclusion = extractBetween(
    /(?:\d+\.?\s*)?(?:CONCLUS[ÕÃ]ES?|CONSIDERA[ÇC][ÕÃ]ES\s+FINAIS)/i,
    /REFERÊNCIAS/i
  );

  // Extrair REFERÊNCIAS
  console.log('\n📖 Extraindo REFERÊNCIAS...');
  const references = cleanText.split(/REFERÊNCIAS\s*BIBLIOGRÁFICAS|REFERÊNCIAS/i)[1]?.trim() || '';
  console.log('📌 Referências:', references ? `${references.length} chars` : 'VAZIO');

  console.log('\n📊 Resumo da extração:');
  console.log('- Título:', title ? 'OK' : 'VAZIO');
  console.log('- Autores:', authors ? 'OK' : 'VAZIO');
  console.log('- Resumo:', abstract ? 'OK' : 'VAZIO');
  console.log('- Introdução:', introduction ? 'OK' : 'VAZIO');
  console.log('- Metodologia:', methodology ? 'OK' : 'VAZIO');
  console.log('- Resultados:', results ? 'OK' : 'VAZIO');
  console.log('- Conclusão:', conclusion ? 'OK' : 'VAZIO');
  console.log('- Referências:', references ? 'OK' : 'VAZIO');

  return {
    title: cleanHtml(title).toUpperCase(), // Padrão IFMS: título em CAIXA ALTA
    subtitle: cleanHtml(subtitle).toUpperCase(), // Padrão IFMS: subtítulo em CAIXA ALTA
    authors: cleanHtml(studentName), // DISCENTE: primeiro nome da linha de autores
    advisors: cleanHtml(advisorName), // DOCENTE: segundo nome da linha de autores
    abstract: cleanHtml(abstract),
    keywords: cleanHtml(keywords),
    englishAbstract: cleanHtml(englishAbstract),
    englishKeywords: cleanHtml(englishKeywords),
    introduction: cleanHtml(stripLeadingHeading(introduction, INTRO_HEADING_PATTERNS)),
    methodology: cleanHtml(stripLeadingHeading(methodology, METHODOLOGY_HEADING_PATTERNS)),
    results: cleanHtml(stripLeadingHeading(results, RESULTS_HEADING_PATTERNS)),
    conclusion: cleanHtml(stripLeadingHeading(conclusion, CONCLUSION_HEADING_PATTERNS)),
    references: cleanHtml(stripLeadingHeading(references, REFERENCES_HEADING_PATTERNS)),
  };
}

// ESTÁGIO 2: Identificar texto dos tópicos teóricos (entre Introdução e Metodologia)
function extractTheoreticalSectionsText(text: string): string {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Encontrar posição da Introdução (seção 1)
  const introMatch = cleanText.match(/1\.?\s*INTRODUÇÃO/i);
  if (!introMatch) {
    console.log('⚠️ Seção INTRODUÇÃO não encontrada');
    return '';
  }
  const introIndex = cleanText.indexOf(introMatch[0]) + introMatch[0].length;

  // Buscar Metodologia com múltiplos padrões (incluindo subseções e nomes alternativos)
  console.log('🔍 Buscando METODOLOGIA para delimitar tópicos teóricos...');
  
  // Padrão 1: Seção numerada "X METODOLOGIA"
  const methodologyMatch1 = cleanText.match(/(\d+)\.?\s*METODOLOGIA/i);
  // Padrão 2: Subseção "X.Y METODOLOGIA" ou "X.Y MATERIAIS E MÉTODOS"
  const methodologyMatch2 = cleanText.match(/(\d+)\.(\d+)\s*(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MATERIAIS?\s+DE\s+DESENVOLVIMENTO)/i);
  // Padrão 3: Seção sem número "METODOLOGIA"
  const methodologyMatch3 = cleanText.match(/(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MÉTODO)/i);
  
  let methodologyIndex = -1;
  
  if (methodologyMatch1) {
    methodologyIndex = cleanText.indexOf(methodologyMatch1[0]);
    console.log('✅ Metodologia encontrada como seção principal:', methodologyMatch1[0], 'na posição', methodologyIndex);
  } else if (methodologyMatch2) {
    methodologyIndex = cleanText.indexOf(methodologyMatch2[0]);
    console.log('✅ Metodologia encontrada como subseção:', methodologyMatch2[0], 'na posição', methodologyIndex);
  } else if (methodologyMatch3) {
    methodologyIndex = cleanText.indexOf(methodologyMatch3[0]);
    console.log('✅ Metodologia encontrada sem número:', methodologyMatch3[0], 'na posição', methodologyIndex);
  } else {
    console.log('⚠️ METODOLOGIA não encontrada com nenhum padrão');
    return '';
  }

  // Extrair texto entre Introdução e Metodologia
  if (methodologyIndex <= introIndex) {
    console.log('⚠️ Metodologia aparece antes da Introdução (estrutura inválida)');
    return '';
  }

  const theoreticalText = cleanText.slice(introIndex, methodologyIndex).trim();
  console.log(`📏 Texto teórico extraído: ${theoreticalText.length} caracteres`);
  
  // Verificar se há seções numeradas (2, 3, etc.) neste trecho
  const hasSections = /\d+\.?\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ]{3,}/.test(theoreticalText);
  if (!hasSections) {
    console.log('⚠️ Nenhuma seção numerada encontrada entre Introdução e Metodologia');
    return '';
  }

  console.log('✅ Tópicos teóricos identificados com sucesso');
  return theoreticalText;
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

  // Extrair título e subtítulo seguindo padrão ABNT
  const fullTitleMatch = cleanText.match(/(?:Campus\s+[^\n]+\s+)?([A-ZÀÂÃÉÊÍÓÔÕÚÇ\s:]{15,200}?)(?:\s+[A-Z][a-z]|\s+RESUMO)/);
  const fullTitle = fullTitleMatch ? fullTitleMatch[1].trim() : '';
  
  let title = '';
  let subtitle = '';
  
  if (fullTitle && fullTitle.includes(':')) {
    const parts = fullTitle.split(':');
    title = parts[0].trim();
    subtitle = parts.slice(1).join(':').trim();
  } else {
    title = fullTitle;
  }

  // Extrair autores seguindo padrão IFMS
  // REGRA: Primeiro nome = DISCENTE (aluno), Segundo nome = DOCENTE (orientador)
  console.log('\n📖 Extraindo AUTORES (padrão IFMS - função fallback)...');
  
  // Buscar a linha completa que contém os autores com marcadores sobrescritos (¹, ², ³, ⁴)
  const authorsLineMatch = cleanText.match(/^[^\n]*[¹²³⁴⁵⁶⁷⁸⁹⁰]+[^\n]*$/m);
  
  let studentName = '';
  let advisorName = '';
  
  if (authorsLineMatch) {
    const authorsLine = authorsLineMatch[0].trim();
    console.log('📌 Linha de autores completa (fallback):', `"${authorsLine}"`);
    
    // Dividir nomes usando os marcadores sobrescritos como separadores
    const authorsList = authorsLine.split(/(?=[¹²³⁴⁵⁶⁷⁸⁹⁰])/).filter(name => name.trim());
    
    if (authorsList.length > 0) {
      // Primeiro nome = DISCENTE (remover marcador sobrescrito)
      studentName = authorsList[0].replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '').trim();
      console.log('📌 Nome do DISCENTE (fallback):', `"${studentName}"`);
    }
    
    if (authorsList.length > 1) {
      // Segundo nome = DOCENTE (remover marcador sobrescrito)
      advisorName = authorsList[1].replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '').trim();
      console.log('📌 Nome do DOCENTE (fallback):', `"${advisorName}"`);
    }
  }

  const abstract = extractBetween(/RESUMO\s*/i, /Palavras-chave:/i);
  const keywordsMatch = cleanText.match(/Palavras-chave:\s*([^.]+(?:\.[^.]+){2,}\.)/i);
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';

  const englishAbstract = extractBetween(/ABSTRACT\s*/i, /Keywords:/i);
  const englishKeywordsMatch = cleanText.match(/Keywords:\s*([^.]+(?:\.[^.]+){2,}\.)/i);
  const englishKeywords = englishKeywordsMatch ? englishKeywordsMatch[1].trim() : '';

  const introduction = extractBetween(/1\.?\s*INTRODUÇÃO/i, /2\.?\s*[A-ZÀÂÃÉÊÍÓÔÕÚÇ]/);
  
  // Metodologia com múltiplos padrões (incluindo subseções e sem número)
  let methodology = extractBetween(/(?:\d+\.?\s*)?(?:METODOLOGIA|MATERIAIS?\s+E\s+MÉTODOS|MÉTODO)/i, /(?:RESULTADOS?|DISCUSS|ANÁLISE|CONCLUS|CONSIDER|REFERÊNCIAS)/i);
  
  // Resultados com ou sem número
  const results = extractBetween(/(?:\d+\.?\s*)?(?:RESULTADOS?|DISCUSS[ÕÃ]ES?)\s*(?:E\s*DISCUSS[ÕÃ]ES?)?/i, /(?:CONCLUS|CONSIDERA[ÇC][ÕÃ]ES|REFERÊNCIAS)/i);
  
  // Conclusão com ou sem número
  const conclusion = extractBetween(/(?:\d+\.?\s*)?(?:CONCLUS[ÕÃ]ES?|CONSIDERA[ÇC][ÕÃ]ES\s+FINAIS)/i, /REFERÊNCIAS/i);
  
  const references = cleanText.split(/REFERÊNCIAS\s*BIBLIOGRÁFICAS|REFERÊNCIAS/i)[1]?.trim() || '';

  return {
    title: cleanHtml(title).toUpperCase(), // Padrão IFMS: título em CAIXA ALTA
    subtitle: cleanHtml(subtitle).toUpperCase(), // Padrão IFMS: subtítulo em CAIXA ALTA
    authors: cleanHtml(studentName), // DISCENTE: primeiro nome da linha de autores
    advisors: cleanHtml(advisorName), // DOCENTE: segundo nome da linha de autores
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
  /^(?:\d+\.?|\d+\.\d+)\s*METODOLOGIA\s*/i,
  /^METODOLOGIA\s*/i,
  /^(?:\d+\.?|\d+\.\d+)\s*Metodologia\s*/i,
  /^Metodologia\s*/i,
  /^(?:\d+\.?|\d+\.\d+)\s*MATERIAIS?\s+E\s+MÉTODOS\s*/i,
  /^MATERIAIS?\s+E\s+MÉTODOS\s*/i,
  /^(?:\d+\.?|\d+\.\d+)\s*MATERIAIS?\s+DE\s+DESENVOLVIMENTO\s*/i,
  /^MATERIAIS?\s+DE\s+DESENVOLVIMENTO\s*/i,
  /^(?:\d+\.?|\d+\.\d+)\s*MÉTODO\s*/i,
  /^MÉTODO\s*/i
];

const RESULTS_HEADING_PATTERNS = [
  /^(?:\d+\.?)?\s*RESULTADOS?\s*(?:E\s*DISCUSS[ÃÕA]O|E\s*DISCUSS[ÃÕA]ES)?\s*/i,
  /^RESULTADOS?\s*(?:E\s*DISCUSS[ÃÕA]O|E\s*DISCUSS[ÃÕA]ES)?\s*/i,
  /^(?:\d+\.?)?\s*Resultados?\s*(?:e\s*Discussão|e\s*Discussões)?\s*/i,
  /^Resultados?\s*(?:e\s*Discussão|e\s*Discussões)?\s*/i
];

const CONCLUSION_HEADING_PATTERNS = [
  /^(?:\d+\.?)?\s*CONCLUS[ÕO]ES?\s*/i,
  /^CONCLUS[ÕO]ES?\s*/i,
  /^(?:\d+\.?)?\s*CONSIDERA[ÇC][ÕO]ES\s+FINAIS\s*/i,
  /^CONSIDERA[ÇC][ÕO]ES\s+FINAIS\s*/i,
  /^(?:\d+\.?)?\s*Conclusão\s*/i,
  /^Conclusão\s*/i
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
