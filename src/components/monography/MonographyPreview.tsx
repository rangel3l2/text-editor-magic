
import { MonographyContent } from "@/hooks/useMonographyContent";
import { cleanLatexCommands } from "@/utils/latexProcessor";

interface MonographyPreviewProps {
  content: MonographyContent;
}

const MonographyPreview = ({ content }: MonographyPreviewProps) => {
  return (
    <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto space-y-12">
      {/* Capa */}
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-lg font-bold mb-1">{cleanLatexCommands(content.institution)}</h1>
          <h2 className="text-lg font-bold">{cleanLatexCommands(content.campus)}</h2>
        </div>
        
        <div className="my-16">
          <p className="text-lg mb-8">{cleanLatexCommands(content.authors)}</p>
          <h1 className="text-2xl font-bold mb-2">{cleanLatexCommands(content.title)}</h1>
          {content.subtitle && (
            <h2 className="text-xl">{cleanLatexCommands(content.subtitle)}</h2>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-lg mb-2">{cleanLatexCommands(content.location)}</p>
          <p className="text-lg">{cleanLatexCommands(content.year)}</p>
        </div>
      </div>

      {/* Folha de Rosto */}
      <div className="text-center space-y-8 mt-16">
        <div className="my-16">
          <p className="text-lg mb-8">{cleanLatexCommands(content.authors)}</p>
          <h1 className="text-2xl font-bold mb-2">{cleanLatexCommands(content.title)}</h1>
          {content.subtitle && (
            <h2 className="text-xl">{cleanLatexCommands(content.subtitle)}</h2>
          )}
        </div>

        <div className="max-w-md mx-auto text-justify">
          <p className="mb-8">{cleanLatexCommands(content.workNature)}</p>
          <p className="mb-2">
            <strong>Orientador(a):</strong> {cleanLatexCommands(content.advisor)}
          </p>
          {content.coAdvisor && (
            <p><strong>Coorientador(a):</strong> {cleanLatexCommands(content.coAdvisor)}</p>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-lg mb-2">{cleanLatexCommands(content.location)}</p>
          <p className="text-lg">{cleanLatexCommands(content.year)}</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-16">
        <h2 className="text-lg font-bold mb-4">RESUMO</h2>
        <div className="text-justify mb-4" dangerouslySetInnerHTML={{ __html: content.abstract }} />
        <p className="italic">
          <strong>Palavras-chave:</strong> {content.keywords}
        </p>
      </div>

      {/* Elementos Textuais */}
      <div className="space-y-8">
        {/* Introdução como texto corrido */}
        <section>
          <h2 className="text-lg font-bold mb-4">1 INTRODUÇÃO</h2>
          <div className="text-justify" dangerouslySetInnerHTML={{ __html: content.introduction }} />
        </section>

        {/* Tópicos do Referencial Teórico */}
        {content.theoreticalTopics.map((topic) => (
          <section key={topic.id}>
            <h2 className="text-lg font-bold mb-4">{topic.order} {topic.title.toUpperCase()}</h2>
            <div className="text-justify" dangerouslySetInnerHTML={{ __html: topic.content }} />
          </section>
        ))}

        {/* Desenvolvimento */}
        <section>
          <h2 className="text-lg font-bold mb-4">{2 + content.theoreticalTopics.length} DESENVOLVIMENTO</h2>
          <div className="text-justify" dangerouslySetInnerHTML={{ __html: content.development }} />
        </section>

        {/* Conclusão */}
        <section>
          <h2 className="text-lg font-bold mb-4">{3 + content.theoreticalTopics.length} CONCLUSÃO</h2>
          <div className="text-justify" dangerouslySetInnerHTML={{ __html: content.conclusion }} />
        </section>

        {/* Referências */}
        <section>
          <h2 className="text-lg font-bold mb-4">REFERÊNCIAS</h2>
          <div dangerouslySetInnerHTML={{ __html: content.references }} />
        </section>
      </div>
    </div>
  );
};

export default MonographyPreview;
