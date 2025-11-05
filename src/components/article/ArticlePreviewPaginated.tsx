import { ArticleContent } from "@/hooks/useArticleContent";
import { cleanLatexCommands } from "@/utils/latexProcessor";
import { sanitizeHtml } from "@/utils/sanitize";
import { useEffect, useRef, useState } from "react";

interface ArticlePreviewPaginatedProps {
  content: ArticleContent;
}

// Função para remover comentários de validação/feedback do conteúdo
const cleanFeedbackComments = (html: string): string => {
  if (!html) return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const feedbackPhrases = [
    'destacar',
    'melhorar',
    'deixar isso',
    'Usando a Teoria',
    'Pense nas possíveis',
    'Foco na pesquisa'
  ];
  
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent?.trim() || '';
    if (text.length < 100 && feedbackPhrases.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()))) {
      p.remove();
    }
  });
  
  const links = tempDiv.querySelectorAll('a[href^="#_msocom"]');
  links.forEach(link => link.remove());
  
  return tempDiv.innerHTML;
};

const ArticlePreviewPaginated = ({ content }: ArticlePreviewPaginatedProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    // Dividir conteúdo em páginas automaticamente
    if (contentRef.current) {
      const pageHeight = 29.7 * 37.795275591; // 29.7cm em pixels
      const sections = contentRef.current.children;
      const newPages: string[] = [];
      let currentPage = '';
      let currentHeight = 0;

      Array.from(sections).forEach((section) => {
        const sectionHeight = section.getBoundingClientRect().height;
        
        if (currentHeight + sectionHeight > pageHeight && currentPage) {
          newPages.push(currentPage);
          currentPage = section.outerHTML;
          currentHeight = sectionHeight;
        } else {
          currentPage += section.outerHTML;
          currentHeight += sectionHeight;
        }
      });

      if (currentPage) {
        newPages.push(currentPage);
      }

      setPages(newPages);
    }
  }, [content]);

  return (
    <div className="academic-preview-container">
      {/* Página 1 - Capa (sem numeração) */}
      <div className="academic-page first-page">
        <div className="text-center mb-8">
          <h1 className="text-[14pt] font-bold mb-2 uppercase leading-tight" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(cleanLatexCommands(content.title))) }} />
          {content.subtitle && (
            <h2 className="text-[12pt] mb-4 leading-tight" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(cleanLatexCommands(content.subtitle))) }} />
          )}
        </div>

        <div className="mb-8 text-center text-[12pt]">
          <div className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.authors)) }} />
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.advisors)) }} />
        </div>

        <div className="mb-8">
          <h2 className="section-title">RESUMO</h2>
          <div className="mb-4 text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.abstract)) }} />
          <p className="text-justify hyphens-auto">
            <span className="font-bold">Palavras-chave:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.keywords)) }} />
          </p>
        </div>

        {content.approvalDate && (
          <div className="mb-8 text-justify">
            <p>Data de aprovação: {content.approvalDate}</p>
          </div>
        )}
      </div>

      {/* Página 2 - Abstract (sem numeração) */}
      <div className="academic-page first-page">
        <div className="mb-8">
          <h2 className="section-title">ABSTRACT</h2>
          <div className="mb-4 text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.englishAbstract)) }} />
          <p className="text-justify hyphens-auto">
            <span className="font-bold">Keywords:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.englishKeywords)) }} />
          </p>
        </div>
      </div>

      {/* Conteúdo oculto para cálculo de altura */}
      <div ref={contentRef} style={{ position: 'absolute', visibility: 'hidden', width: '21cm' }}>
        <div className="mb-8">
          <h2 className="section-title">1 INTRODUÇÃO</h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.introduction)) }} />
        </div>

        {content.theoreticalTopics.map((topic) => (
          <div key={topic.id} className="mb-8">
            <h2 className="section-title">{topic.order} {topic.title.toUpperCase()}</h2>
            <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(topic.content)) }} />
          </div>
        ))}

        <div className="mb-8">
          <h2 className="section-title">
            {2 + content.theoreticalTopics.length} METODOLOGIA
          </h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.methodology)) }} />
        </div>

        <div className="mb-8">
          <h2 className="section-title">
            {2 + content.theoreticalTopics.length + 1} RESULTADOS E DISCUSSÃO
          </h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.results)) }} />
        </div>

        <div className="mb-8">
          <h2 className="section-title">CONCLUSÃO</h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.conclusion)) }} />
        </div>

        <div className="references">
          <h2 className="section-title">REFERÊNCIAS</h2>
          <div className="text-left leading-normal" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.references)) }} />
        </div>
      </div>

      {/* Páginas de conteúdo numeradas */}
      {pages.map((pageContent, index) => (
        <div key={index} className="academic-page content-page">
          <div className="page-number">{index + 1}</div>
          <div dangerouslySetInnerHTML={{ __html: pageContent }} />
        </div>
      ))}
    </div>
  );
};

export default ArticlePreviewPaginated;
