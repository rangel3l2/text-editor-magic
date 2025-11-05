import { ArticleContent } from "@/hooks/useArticleContent";
import { cleanLatexCommands } from "@/utils/latexProcessor";
import { sanitizeHtml } from "@/utils/sanitize";

interface ArticlePreviewProps {
  content: ArticleContent;
}

// Função para remover comentários de validação/feedback do conteúdo
const cleanFeedbackComments = (html: string): string => {
  if (!html) return '';
  
  // Remove parágrafos que contenham apenas comentários de validação
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove parágrafos que começam com frases típicas de feedback
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
    // Remove se for apenas feedback (texto curto com palavras-chave de feedback)
    if (text.length < 100 && feedbackPhrases.some(phrase => text.toLowerCase().includes(phrase.toLowerCase()))) {
      p.remove();
    }
  });
  
  // Remove links de comentários do Word [1], [2], etc
  const links = tempDiv.querySelectorAll('a[href^="#_msocom"]');
  links.forEach(link => link.remove());
  
  return tempDiv.innerHTML;
};

const ArticlePreview = ({ content }: ArticlePreviewProps) => {
  return (
    <div className="academic-preview-container">
      {/* Página 1 - Capa/Título (sem numeração) */}
      <div className="academic-page first-page">
        {/* Título e Subtítulo */}
        <div className="text-center mb-8">
          <h1 className="text-[14pt] font-bold mb-2 uppercase leading-tight" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(cleanLatexCommands(content.title))) }} />
          {content.subtitle && (
            <h2 className="text-[12pt] mb-4 leading-tight" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(cleanLatexCommands(content.subtitle))) }} />
          )}
        </div>

        {/* Autores e Orientadores */}
        <div className="mb-8 text-center text-[12pt]">
          <div className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.authors)) }} />
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.advisors)) }} />
        </div>

        {/* Resumo */}
        <div className="mb-8">
          <h2 className="section-title">RESUMO</h2>
          <div className="mb-4 text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.abstract)) }} />
          <p className="text-justify hyphens-auto">
            <span className="font-bold">Palavras-chave:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.keywords)) }} />
          </p>
        </div>

      </div>

      {/* Página 2 - Abstract (sem numeração) */}
      <div className="academic-page first-page">
        {/* Abstract */}
        <div className="mb-8">
          <h2 className="section-title">ABSTRACT</h2>
          <div className="mb-4 text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.englishAbstract)) }} />
          <p className="text-justify hyphens-auto">
            <span className="font-bold">Keywords:</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.englishKeywords)) }} />
          </p>
        </div>

        {/* Data de aprovação */}
        {content.approvalDate && (
          <div className="mb-8 text-justify">
            <p>Data de aprovação: {content.approvalDate}</p>
          </div>
        )}
      </div>

      {/* Páginas de conteúdo - numeração começa após introdução */}
      <div className="academic-page content-page">
        
        {/* Introdução */}
        <div className="mb-8">
          <h2 className="section-title">1 INTRODUÇÃO</h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.introduction)) }} />
        </div>

      </div>

      {/* Páginas de conteúdo - com numeração a partir daqui */}
      <div className="academic-page content-page">
        <div className="page-number">1</div>
        
        {/* Tópicos do Referencial Teórico */}
        {content.theoreticalTopics.map((topic, index) => (
          <div key={topic.id} className="mb-8">
            <h2 className="section-title">{topic.order} {topic.title.toUpperCase()}</h2>
            <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(topic.content)) }} />
          </div>
        ))}

        {/* Metodologia */}
        <div className="mb-8">
          <h2 className="section-title">
            {2 + content.theoreticalTopics.length} METODOLOGIA
          </h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.methodology)) }} />
        </div>

        {/* Resultados e Discussão */}
        <div className="mb-8">
          <h2 className="section-title">
            {2 + content.theoreticalTopics.length + 1} RESULTADOS E DISCUSSÃO
          </h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.results)) }} />
        </div>

        {/* Conclusão */}
        <div className="mb-8">
          <h2 className="section-title">CONCLUSÃO</h2>
          <div className="text-justify hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.conclusion)) }} />
        </div>

        {/* Referências */}
        <div className="references">
          <h2 className="section-title">REFERÊNCIAS</h2>
          <div className="text-left leading-normal" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanFeedbackComments(content.references)) }} />
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
