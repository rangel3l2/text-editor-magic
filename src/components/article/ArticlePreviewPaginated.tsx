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
  const sanitize = (s: string) => sanitizeHtml(cleanFeedbackComments(cleanLatexCommands(s || '')));

  // Capa (sem numeração)
  blocks.push({ html: `
    <div class="text-center mb-8">
      <h1 class="text-[14pt] font-bold mb-2 uppercase leading-tight" >${sanitize(content.title)}</h1>
      ${content.subtitle ? `<h2 class="text-[12pt] mb-4 leading-tight">${sanitize(content.subtitle)}</h2>` : ''}
    </div>
    <div class="mb-8 text-center text-[12pt]">
      <div class="mb-4">${sanitize(content.authors)}</div>
      <div>${sanitize(content.advisors)}</div>
    </div>
    <div class="mb-8">
      <h2 class="section-title">RESUMO</h2>
      <div class="mb-4 text-justify hyphens-auto">${sanitize(content.abstract)}</div>
      <p class="text-justify hyphens-auto"><span class="font-bold">Palavras-chave:</span> ${sanitize(content.keywords)}</p>
    </div>
  `});

  // Abstract (sem numeração)
  blocks.push({ html: `
    <div class="mb-8">
      <h2 class="section-title">ABSTRACT</h2>
      <div class="mb-4 text-justify hyphens-auto">${sanitize(content.englishAbstract)}</div>
      <p class="text-justify hyphens-auto"><span class="font-bold">Keywords:</span> ${sanitize(content.englishKeywords)}</p>
    </div>
  `});

  // Introdução
  blocks.push({ html: `<h2 class="section-title">1 INTRODUÇÃO</h2>` });
  const introHtml = ensureParagraphs(content.introduction);
  const introTemp = document.createElement('div');
  introTemp.innerHTML = sanitize(introHtml);
  introTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => {
    blocks.push({ html: (el as HTMLElement).outerHTML });
  });
  blocks.push({ html: '<!-- INTRO_END -->', mark: 'INTRO_END' });

  // Referencial teórico
  content.theoreticalTopics.forEach((topic) => {
    blocks.push({ html: `<h2 class="section-title">${topic.order} ${topic.title.toUpperCase()}</h2>` });
    const topicTemp = document.createElement('div');
    topicTemp.innerHTML = sanitize(ensureParagraphs(topic.content));
    topicTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => {
      blocks.push({ html: (el as HTMLElement).outerHTML });
    });
  });

  // Metodologia
  blocks.push({ html: `<h2 class="section-title">${2 + content.theoreticalTopics.length} METODOLOGIA</h2>` });
  const methTemp = document.createElement('div');
  methTemp.innerHTML = sanitize(ensureParagraphs(content.methodology));
  methTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

  // Resultados
  blocks.push({ html: `<h2 class="section-title">${2 + content.theoreticalTopics.length + 1} RESULTADOS E DISCUSSÃO</h2>` });
  const resTemp = document.createElement('div');
  resTemp.innerHTML = sanitize(ensureParagraphs(content.results));
  resTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

  // Conclusão
  blocks.push({ html: `<h2 class="section-title">CONCLUSÃO</h2>` });
  const conclTemp = document.createElement('div');
  conclTemp.innerHTML = sanitize(ensureParagraphs(content.conclusion));
  conclTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

  // Referências (contam fora do total de páginas textuais, mas mostramos)
  blocks.push({ html: `<div class="references"><h2 class="section-title">REFERÊNCIAS</h2></div>` });
  const refTemp = document.createElement('div');
  refTemp.innerHTML = sanitize(ensureParagraphs(content.references));
  refTemp.querySelectorAll('p, ul, ol, table, blockquote, div').forEach(el => blocks.push({ html: (el as HTMLElement).outerHTML }));

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
