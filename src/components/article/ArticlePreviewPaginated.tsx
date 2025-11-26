import { ArticleContent } from "@/hooks/useArticleContent";
import { cleanLatexCommands } from "@/utils/latexProcessor";
import { sanitizeHtml } from "@/utils/sanitize";
import { useEffect, useMemo, useState } from "react";

interface ArticlePreviewPaginatedProps {
  content: ArticleContent;
}

// Remove comentários e anchors de feedback
const cleanFeedbackComments = (html: string): string => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const feedbackPhrases = [
    'destacar', 'melhorar', 'deixar isso', 'Usando a Teoria', 'Pense nas possíveis', 'Foco na pesquisa'
  ];
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent?.trim() || '';
    if (text.length < 100 && feedbackPhrases.some(ph => text.toLowerCase().includes(ph.toLowerCase()))) {
      p.remove();
    }
  });
  tempDiv.querySelectorAll('a[href^="#_msocom"]').forEach(a => a.remove());
  return tempDiv.innerHTML;
};

// Garante <p> quando o usuário cola texto "cru"
const ensureParagraphs = (html: string): string => {
  if (!html) return '';
  if (/<p[\s>]/i.test(html)) return html; // já possui parágrafos
  const text = html.replace(/<br\s*\/?>(\r?\n)?/gi, '\n').replace(/&nbsp;/g, ' ').trim();
  const parts = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  if (!parts.length) return `<p>${text}</p>`;
  return parts.map(p => `<p>${p}</p>`).join('');
};

// Constrói blocos HTML (títulos e parágrafos) prontos para paginar
const buildBlocks = (content: ArticleContent) => {
  const blocks: { html: string; mark?: 'INTRO_END' }[] = [];
  const sanitize = (s: string) => sanitizeHtml(cleanFeedbackComments(cleanLatexCommands(s || "")));
  const sanitizePlain = (s: string) => {
    const html = sanitize(s || "");
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  // Título
  blocks.push({ html: `<div id="article-title" class="text-center mb-8"><h1 class="text-2xl font-bold mb-2 uppercase leading-tight">${sanitize(content.title)}</h1></div>` });
  
  // Subtítulo (se existir)
  if (content.subtitle) {
    blocks.push({ html: `<div class="text-center mb-4"><h2 class="text-xl leading-tight">${sanitize(content.subtitle)}</h2></div>` });
  }

  // Autores
  blocks.push({ html: `<div id="article-authors" class="mb-4 text-center">${sanitize(content.authors)}</div>` });
  
  // Orientadores
  blocks.push({ html: `<div class="mb-8 text-center">${sanitize(content.advisors)}</div>` });

  // Marca fim dos pré-textuais antes do Resumo (para quebra de página)
  blocks.push({ html: '<!-- PAGE_BREAK -->', mark: 'PAGE_BREAK' as any });

  // Resumo - título
  blocks.push({ html: `<div id="article-abstract" class="mb-4"><h2 class="section-title unnumbered-section">RESUMO</h2></div>` });
  
  // Resumo - conteúdo
  blocks.push({ html: `<div class="mb-4 text-justify hyphens-auto">${sanitize(content.abstract)}</div>` });
  
  // Palavras-chave
  if (content.keywords && content.keywords.trim()) {
    const keywordsText = sanitizePlain(content.keywords);
    blocks.push({ html: `<p class="mb-4 keywords-line"><strong>Palavras-chave:</strong> ${keywordsText}</p>` });
  }

  // Marca fim do Resumo (para quebra de página antes do Abstract)
  blocks.push({ html: '<!-- PAGE_BREAK -->', mark: 'PAGE_BREAK' as any });

  // Abstract - título
  blocks.push({ html: `<div class="mb-4"><h2 class="section-title unnumbered-section">ABSTRACT</h2></div>` });
  
  // Abstract - conteúdo
  blocks.push({ html: `<div class="mb-4 text-justify hyphens-auto">${sanitize(content.englishAbstract)}</div>` });
  
  // Keywords
  if (content.englishKeywords && content.englishKeywords.trim()) {
    const englishKeywordsText = sanitizePlain(content.englishKeywords);
    blocks.push({ html: `<p class="mb-8 keywords-line"><strong>Keywords:</strong> ${englishKeywordsText}</p>` });
  }

  // Marca fim do Abstract (para quebra de página antes da Introdução)
  blocks.push({ html: '<!-- PAGE_BREAK -->', mark: 'PAGE_BREAK' as any });


  // Introdução
  blocks.push({ html: `<h2 id="article-introduction" class="section-title">1 INTRODUÇÃO</h2>` });
  const introHtml = ensureParagraphs(content.introduction);
  const introTemp = document.createElement('div');
  introTemp.innerHTML = sanitize(introHtml);
  introTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => {
    blocks.push({ html: (el as HTMLElement).outerHTML });
  });
  blocks.push({ html: '<!-- INTRO_END -->', mark: 'INTRO_END' });

  // Referencial teórico
  content.theoreticalTopics.forEach((topic, index) => {
    blocks.push({ html: `<h2 id="article-theoretical-${index}" class="section-title">${topic.order} ${topic.title.toUpperCase()}</h2>` });
    const topicTemp = document.createElement('div');
    topicTemp.innerHTML = sanitize(ensureParagraphs(topic.content));
    topicTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => {
      blocks.push({ html: (el as HTMLElement).outerHTML });
    });
  });

  // Metodologia
  blocks.push({ html: `<h2 id="article-methodology" class="section-title">${2 + content.theoreticalTopics.length} METODOLOGIA</h2>` });
  const methTemp = document.createElement('div');
  methTemp.innerHTML = sanitize(ensureParagraphs(content.methodology));
  methTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

  // Imagens da metodologia (se existirem)
  if (content.images && content.images.length > 0) {
    content.images
      .filter((img) => img.section === 'methodology')
      .forEach((img, index) => {
        blocks.push({
          html: `<figure class="mb-4 text-center">
            <div class="text-justify hyphens-auto"><strong>${(img.type || 'Figura').toUpperCase()} ${index + 1}:</strong> ${sanitize(img.caption || '')}</div>
            <div class="text-[10pt] italic text-justify hyphens-auto">${sanitize(img.source || '')}</div>
          </figure>`
        });
      });
  }

  // Resultados
  blocks.push({ html: `<h2 id="article-results" class="section-title">${2 + content.theoreticalTopics.length + 1} RESULTADOS E DISCUSSÃO</h2>` });
  const resTemp = document.createElement('div');
  resTemp.innerHTML = sanitize(ensureParagraphs(content.results));
  resTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

  // Imagens dos resultados (se existirem)
  if (content.images && content.images.length > 0) {
    content.images
      .filter((img) => img.section === 'results')
      .forEach((img, index) => {
        blocks.push({
          html: `<figure class="mb-4 text-center">
            <div class="text-justify hyphens-auto"><strong>${(img.type || 'Figura').toUpperCase()} ${index + 1}:</strong> ${sanitize(img.caption || '')}</div>
            <div class="text-[10pt] italic text-justify hyphens-auto">${sanitize(img.source || '')}</div>
          </figure>`
        });
      });
  }

  // Conclusão
  blocks.push({ html: `<h2 id="article-conclusion" class="section-title">CONCLUSÃO</h2>` });
  const conclTemp = document.createElement('div');
  conclTemp.innerHTML = sanitize(ensureParagraphs(content.conclusion));
  conclTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

  // Imagens da conclusão (se existirem)
  if (content.images && content.images.length > 0) {
    content.images
      .filter((img) => img.section === 'conclusion')
      .forEach((img, index) => {
        blocks.push({
          html: `<figure class="mb-4 text-center">
            <div class="text-justify hyphens-auto"><strong>${(img.type || 'Figura').toUpperCase()} ${index + 1}:</strong> ${sanitize(img.caption || '')}</div>
            <div class="text-[10pt] italic text-justify hyphens-auto">${sanitize(img.source || '')}</div>
          </figure>`
        });
      });
  }

  // Marca fim da Conclusão (para quebra de página antes das Referências)
  blocks.push({ html: '<!-- PAGE_BREAK -->', mark: 'PAGE_BREAK' as any });

  // Referências (contam fora do total de páginas textuais, mas mostramos)
  blocks.push({ html: `<div id="article-references" class="references"><h2 class="section-title unnumbered-section">REFERÊNCIAS</h2></div>` });
  const refTemp = document.createElement('div');
  refTemp.innerHTML = sanitize(ensureParagraphs(content.references));
  refTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => {
    const element = el as HTMLElement;
    element.classList.add('reference-item');
    blocks.push({ html: element.outerHTML });
  });

  return blocks;
};

const ArticlePreviewPaginated = ({ content }: ArticlePreviewPaginatedProps) => {
  const [pages, setPages] = useState<string[]>([]);
  const [introEndsAtPage, setIntroEndsAtPage] = useState<number>(-1);

  const blocks = useMemo(() => buildBlocks(content), [content]);

  useEffect(() => {
    // Construir páginas medindo altura real, sem overflow hidden
    const sandbox = document.createElement('div');
    sandbox.style.position = 'absolute';
    sandbox.style.visibility = 'hidden';
    sandbox.style.width = '21cm';
    sandbox.style.left = '-10000px';
    sandbox.className = 'academic-preview';

    document.body.appendChild(sandbox);

    const makePage = () => {
      const page = document.createElement('div');
      page.className = 'academic-page content-page';
      const contentWrap = document.createElement('div');
      page.appendChild(contentWrap);
      sandbox.appendChild(page);
      return { page, contentWrap };
    };

    const resultPages: string[] = [];
    let { page, contentWrap } = makePage();
    let introEndPageIndex = -1;

    for (const block of blocks) {
      if (block.mark === 'INTRO_END') {
        // Marca fim da introdução no índice da página atual
        introEndPageIndex = resultPages.length; // páginas finalizadas até agora
        continue;
      }

      // Verifica se é uma quebra de página forçada
      if (block.mark === 'PAGE_BREAK' || block.html.includes('<!-- PAGE_BREAK -->')) {
        // Força nova página
        resultPages.push(page.innerHTML);
        sandbox.removeChild(page);
        ({ page, contentWrap } = makePage());
        continue;
      }

      const holder = document.createElement('div');
      holder.innerHTML = block.html;
      const node = holder.firstElementChild as HTMLElement;
      if (!node) continue;
      contentWrap.appendChild(node);

      // Se estourou a altura da página, move para próxima
      if (page.scrollHeight > page.clientHeight) {
        // remove o último e fecha a página atual
        contentWrap.removeChild(node);
        resultPages.push(page.innerHTML);
        sandbox.removeChild(page);
        ({ page, contentWrap } = makePage());
        contentWrap.appendChild(node);
      }
    }

    // Empurra a última página
    resultPages.push(page.innerHTML);

    setPages(resultPages);
    setIntroEndsAtPage(introEndPageIndex);

    document.body.removeChild(sandbox);
  }, [blocks]);

  return (
    <div className="academic-preview-container academic-preview">
      {/* Primeira página (capa) e segunda (abstract) já estão nos primeiros blocos, mas a paginação acima trata tudo */}
      {pages.map((html, i) => {
        const showNumber = introEndsAtPage >= 0 && i > introEndsAtPage;
        const pageNumber = showNumber ? i - introEndsAtPage : null;
        return (
          <div key={i} className="academic-page content-page">
            {showNumber && <div className="page-number">{pageNumber}</div>}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      })}
    </div>
  );
};

export default ArticlePreviewPaginated;
