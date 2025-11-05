import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Ler o conteúdo do arquivo
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(fileBuffer);
    
    // Aqui você usaria uma biblioteca de parsing (como pdf-parse ou mammoth)
    // Por enquanto, vamos retornar uma estrutura de exemplo
    // TODO: Implementar parsing real usando bibliotecas apropriadas
    
    const parsedContent = await parseDocument(file.type, fileContent);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Erro ao processar artigo:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function parseDocument(mimeType: string, content: Uint8Array) {
  // TODO: Implementar parsing real
  // Por enquanto, extrair usando regex simples do texto convertido
  
  const text = new TextDecoder().decode(content);
  
  // Patterns para identificar seções
  const sections = {
    title: extractSection(text, /^[A-ZÀÂÃÉÊÍÓÔÕÚ\s]{10,}$/m, 1),
    authors: extractSection(text, /(?:Autor|Author).*?:\s*(.+)/i, 1),
    institution: extractSection(text, /(?:Instituição|Institution).*?:\s*(.+)/i, 1),
    advisors: extractSection(text, /(?:Orientador|Advisor).*?:\s*(.+)/i, 1),
    abstract: extractBetween(text, /RESUMO/i, /Palavras-chave/i),
    keywords: extractSection(text, /Palavras-chave:\s*(.+)/i, 1),
    englishAbstract: extractBetween(text, /ABSTRACT/i, /Keywords/i),
    englishKeywords: extractSection(text, /Keywords:\s*(.+)/i, 1),
    introduction: extractBetween(text, /1\.?\s*INTRODUÇÃO/i, /2\.?\s*(?:REFERENCIAL|FUNDAMENTAÇÃO)/i),
    methodology: extractBetween(text, /METODOLOGIA/i, /RESULTADOS/i),
    results: extractBetween(text, /RESULTADOS/i, /CONCLUS[ÃA]O/i),
    conclusion: extractBetween(text, /CONCLUS[ÃA]O/i, /REFERÊNCIAS/i),
    references: extractAfter(text, /REFERÊNCIAS/i),
  };

  return sections;
}

function extractSection(text: string, pattern: RegExp, groupIndex: number = 0): string {
  const match = text.match(pattern);
  return match?.[groupIndex]?.trim() || '';
}

function extractBetween(text: string, startPattern: RegExp, endPattern: RegExp): string {
  const startMatch = text.search(startPattern);
  if (startMatch === -1) return '';
  
  const afterStart = text.slice(startMatch);
  const endMatch = afterStart.search(endPattern);
  
  if (endMatch === -1) return '';
  
  const extracted = afterStart.slice(0, endMatch);
  // Remove o título da seção
  return extracted.replace(startPattern, '').trim();
}

function extractAfter(text: string, pattern: RegExp): string {
  const match = text.search(pattern);
  if (match === -1) return '';
  
  const extracted = text.slice(match);
  return extracted.replace(pattern, '').trim();
}
