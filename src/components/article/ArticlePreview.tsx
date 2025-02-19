
import { Card } from "@/components/ui/card";
import { ArticleContent } from "@/hooks/useArticleContent";
import { cleanLatexCommands } from "@/utils/latexProcessor";

interface ArticlePreviewProps {
  content: ArticleContent;
}

const ArticlePreview = ({ content }: ArticlePreviewProps) => {
  return (
    <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto">
      {/* Título e Subtítulo */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{cleanLatexCommands(content.title)}</h1>
        {content.subtitle && (
          <h2 className="text-xl mb-4">{cleanLatexCommands(content.subtitle)}</h2>
        )}
      </div>

      {/* Autores e Orientadores */}
      <div className="mb-8 text-center">
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: content.authors }} />
        <div dangerouslySetInnerHTML={{ __html: content.advisors }} />
      </div>

      {/* Resumo */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">RESUMO</h2>
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: content.abstract }} />
        <p className="italic">
          <span className="font-bold">Palavras-chave:</span> {content.keywords}
        </p>
      </div>

      {/* Abstract */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">ABSTRACT</h2>
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: content.englishAbstract }} />
        <p className="italic">
          <span className="font-bold">Keywords:</span> {content.englishKeywords}
        </p>
      </div>

      {/* Data de aprovação */}
      {content.approvalDate && (
        <div className="mb-8">
          <p>Data de aprovação: {content.approvalDate}</p>
        </div>
      )}

      {/* Introdução */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">1 INTRODUÇÃO</h2>
        <div dangerouslySetInnerHTML={{ __html: content.introduction }} />
      </div>

      {/* Desenvolvimento */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">2 DESENVOLVIMENTO</h2>
        <div dangerouslySetInnerHTML={{ __html: content.development }} />
      </div>

      {/* Conclusão */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">3 CONCLUSÃO</h2>
        <div dangerouslySetInnerHTML={{ __html: content.conclusion }} />
      </div>

      {/* Referências */}
      <div>
        <h2 className="text-lg font-bold mb-2">REFERÊNCIAS</h2>
        <div dangerouslySetInnerHTML={{ __html: content.references }} />
      </div>
    </div>
  );
};

export default ArticlePreview;
