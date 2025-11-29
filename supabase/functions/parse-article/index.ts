import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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
  const uint8Array = new Uint8Array(buffer);
  const extractedImages: ExtractedImage[] = [];
  let imageIndex = 0;
  
  console.log('🔍 Iniciando conversão do DOCX com mammoth...');
  console.log(`📦 Tamanho do buffer: ${buffer.byteLength} bytes`);
  
  const options = {
    buffer: uint8Array,
    convertImage: mammoth.images.imgElement(async function(image: any) {
      console.log(`🖼️ Imagem detectada pelo mammoth! Index: ${imageIndex}`);
      console.log(`   - ContentType: ${image.contentType}`);
      
      try {
        const imageBuffer = await image.read();
        console.log(`   - Buffer lido: ${imageBuffer.byteLength} bytes`);
        
        const bytes = new Uint8Array(imageBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const mimeType = image.contentType || 'image/png';
        
        console.log(`   - Base64 gerado: ${base64.length} caracteres`);
        console.log(`   - MIME type: ${mimeType}`);
        
        extractedImages.push({
          id: `img-${imageIndex}`,
          base64: base64,
          mimeType: mimeType,
          position: imageIndex,
          contextText: ''
        });
        
        console.log(`✅ Imagem ${imageIndex} extraída com sucesso`);
        
        // Marcador para identificar posição no HTML
        const placeholder = `[[IMAGE_PLACEHOLDER_${imageIndex++}]]`;
        return { src: placeholder };
      } catch (err) {
        console.error(`❌ Erro ao processar imagem ${imageIndex}:`, err);
        imageIndex++;
        return { src: '' };
      }
    })
  };
  
  console.log('🔄 Chamando mammoth.convertToHtml...');
  const result = await mammoth.convertToHtml(options);
  console.log(`✅ Conversão mammoth concluída. HTML gerado: ${result.value.length} caracteres`);
  console.log(`📊 Total de imagens capturadas: ${extractedImages.length}`);
  
  if (result.messages && result.messages.length > 0) {
    console.log('⚠️ Mensagens do mammoth:');
    result.messages.forEach((msg: any) => {
      console.log(`   - ${msg.type}: ${msg.message}`);
    });
  }
  
  // Extrair contexto de cada imagem (texto ao redor)
  const htmlContent = result.value;
  console.log(`🔍 Procurando contexto para ${extractedImages.length} imagens no HTML...`);
  
  extractedImages.forEach((img, idx) => {
    const marker = `[[IMAGE_PLACEHOLDER_${idx}]]`;
    const markerPos = htmlContent.indexOf(marker);
    if (markerPos !== -1) {
      console.log(`   ✅ Marcador ${idx} encontrado na posição ${markerPos}`);
      // Pegar 200 chars antes e depois como contexto
      const start = Math.max(0, markerPos - 200);
      const end = Math.min(htmlContent.length, markerPos + 200);
      img.contextText = htmlContent.substring(start, end)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`      Contexto: "${img.contextText.substring(0, 50)}..."`);
    } else {
      console.log(`   ⚠️ Marcador ${idx} NÃO encontrado no HTML`);
    }
  });
  
  // Converter HTML para texto simples
  const textOnly = result.value
    .replace(/<[^>]+>/g, '\n')
    .replace(/\[\[IMAGE_PLACEHOLDER_\d+\]\]/g, '[IMAGEM]')
    .replace(/\s+/g, ' ')
    .trim();
  
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
    
    if (data.success && data.data && data.data.image && data.data.image.url) {
      console.log('✅ Upload bem-sucedido! URL da imagem:', data.data.image.url);
      return data.data.image.url;
    } else {
      console.error('❌ ImgBB retornou sucesso=false ou sem URL da imagem');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Exceção ao fazer upload para ImgBB:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return null;
  }
}

async function extractArticleSectionsWithAI(text: string, images?: ExtractedImage[]) {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY não configurada, usando extração regex');
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

IMPORTANTE: Para cada imagem encontrada, identifique:
1. A seção onde deve aparecer (introduction, methodology, results, conclusion)
2. O tipo: "figura", "grafico" ou "tabela"
3. A legenda (procure por "Figura X:", "Gráfico X:", "Tabela X:" próximo à imagem no contexto)
4. A fonte (procure por "Fonte:" logo abaixo da legenda)

Adicione ao JSON um campo "images" com array de objetos:
{
  "images": [
    {
      "url": "https://i.ibb.co/...",
      "type": "figura",
      "caption": "Figura 1: Descrição da imagem",
      "source": "Fonte: Autores (2024)",
      "section": "results"
    }
  ]
}`;
      }
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
  - url: URL do ImgBB fornecida acima
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
  "images": [{"url": "https://i.ibb.co/...", "type": "figura", "caption": "...", "source": "...", "section": "results"}, ...]
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
    
    // Encontrar o JSON válido entre { e }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('JSON não encontrado na resposta da IA');
      return extractArticleSections(text);
    }
    
    let jsonStr = content.substring(firstBrace, lastBrace + 1);
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    let aiResult;
    try {
      aiResult = JSON.parse(jsonStr);
      console.log('✅ JSON parseado com sucesso');
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return extractArticleSections(text);
    }

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
