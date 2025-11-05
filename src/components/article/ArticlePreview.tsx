import { ArticleContent } from "@/hooks/useArticleContent";
import { cleanLatexCommands } from "@/utils/latexProcessor";
import { sanitizeHtml } from "@/utils/sanitize";

interface ArticlePreviewProps {
  content: ArticleContent;
}

const ArticlePreview = ({ content }: ArticlePreviewProps) => {
  return (
    <div className="academic-preview-container">
      {/* Página 1 - Capa/Título (sem numeração) */}
      <div className="academic-page first-page">
        {/* Título e Subtítulo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 uppercase">{cleanLatexCommands(content.title)}</h1>
          {content.subtitle && (
            <h2 className="text-xl mb-4">{cleanLatexCommands(content.subtitle)}</h2>
          )}
        </div>

        {/* Autores e Orientadores */}
        <div className="mb-8 text-center text-[12pt]">
          <div className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.authors) }} />
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.advisors) }} />
        </div>

        {/* Resumo */}
        <div className="mb-8">
          <h2 className="section-title">RESUMO</h2>
          <div className="mb-4 text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.abstract) }} />
          <p className="text-justify hyphens-auto">
            <span className="font-bold">Palavras-chave:</span> {content.keywords}
          </p>
        </div>

        {/* Abstract */}
        <div className="mb-8">
          <h2 className="section-title">ABSTRACT</h2>
          <div className="mb-4 text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.englishAbstract) }} />
          <p className="text-justify hyphens-auto">
            <span className="font-bold">Keywords:</span> {content.englishKeywords}
          </p>
        </div>

        {/* Data de aprovação */}
        {content.approvalDate && (
          <div className="mb-8 text-justify">
            <p>Data de aprovação: {content.approvalDate}</p>
          </div>
        )}
      </div>

      {/* Páginas de conteúdo - com numeração */}
      <div className="academic-page content-page">
        <div className="page-number">1</div>
        
        {/* Introdução */}
        <div className="mb-8">
          <h2 className="section-title">1 INTRODUÇÃO</h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.introduction) }} />
        </div>

        {/* Tópicos do Referencial Teórico */}
        {content.theoreticalTopics.map((topic, index) => (
          <div key={topic.id} className="mb-8">
            <h2 className="section-title">{topic.order} {topic.title.toUpperCase()}</h2>
            <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(topic.content) }} />
          </div>
        ))}

        {/* Metodologia */}
        <div className="mb-8">
          <h2 className="section-title">
            {2 + content.theoreticalTopics.length} METODOLOGIA
          </h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.methodology) }} />
        </div>

        {/* Resultados e Discussão */}
        <div className="mb-8">
          <h2 className="section-title">
            {2 + content.theoreticalTopics.length + 1} RESULTADOS E DISCUSSÃO
          </h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.results) }} />
        </div>

        {/* Conclusão */}
        <div className="mb-8">
          <h2 className="section-title">CONCLUSÃO</h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.conclusion) }} />
        </div>

        {/* Referências */}
        <div className="references">
          <h2 className="section-title">REFERÊNCIAS</h2>
          <div className="text-left leading-normal" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.references) }} />
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
