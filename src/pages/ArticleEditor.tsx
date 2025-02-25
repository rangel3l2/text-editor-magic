import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";
import { useArticleContent } from "@/hooks/useArticleContent";
import { Separator } from "@/components/ui/separator";
import ArticlePreview from "@/components/article/ArticlePreview";
import { useState } from "react";
import { Eye } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

const ArticleEditor = () => {
  const { user } = useAuth();
  const { content, handleChange } = useArticleContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Editor de Artigo Científico</h2>
          <Button 
            onClick={() => setPreviewOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Visualizar
          </Button>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
            <ArticlePreview content={content} />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Editor de Artigo Científico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Título e Subtítulo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Título e Subtítulo</h3>
              <RichTextEditor
                value={content.title}
                onChange={(value) => handleChange('title', value)}
                maxLines={3}
                minLines={1}
                sectionName="título"
                placeholder="Digite o título do artigo..."
              />
              <RichTextEditor
                value={content.subtitle}
                onChange={(value) => handleChange('subtitle', value)}
                maxLines={2}
                minLines={0}
                sectionName="subtítulo"
                placeholder="Digite o subtítulo (se houver)..."
              />
            </div>

            <Separator />

            {/* Autores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Autores</h3>
              <RichTextEditor
                value={content.authors}
                onChange={(value) => handleChange('authors', value)}
                maxLines={4}
                minLines={1}
                sectionName="autores"
                placeholder="Digite os nomes dos autores (um por linha)..."
              />
              <RichTextEditor
                value={content.advisors}
                onChange={(value) => handleChange('advisors', value)}
                maxLines={2}
                minLines={1}
                sectionName="orientadores"
                placeholder="Digite os nomes dos orientadores..."
              />
            </div>

            <Separator />

            {/* Resumo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo</h3>
              <RichTextEditor
                value={content.abstract}
                onChange={(value) => handleChange('abstract', value)}
                maxLines={15}
                minLines={5}
                sectionName="resumo"
                placeholder="Digite o resumo (100 a 250 palavras)..."
              />
              <RichTextEditor
                value={content.keywords}
                onChange={(value) => handleChange('keywords', value)}
                maxLines={2}
                minLines={1}
                sectionName="palavras-chave"
                placeholder="Digite as palavras-chave (3 a 5 palavras, separadas por ponto)..."
              />
            </div>

            <Separator />

            {/* Abstract */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Abstract</h3>
              <RichTextEditor
                value={content.englishAbstract}
                onChange={(value) => handleChange('englishAbstract', value)}
                maxLines={15}
                minLines={5}
                sectionName="abstract"
                placeholder="Type the abstract..."
              />
              <RichTextEditor
                value={content.englishKeywords}
                onChange={(value) => handleChange('englishKeywords', value)}
                maxLines={2}
                minLines={1}
                sectionName="keywords"
                placeholder="Type the keywords (3 to 5 words, separated by dots)..."
              />
            </div>

            <Separator />

            {/* Introdução */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1 Introdução</h3>
              <RichTextEditor
                value={content.introduction}
                onChange={(value) => handleChange('introduction', value)}
                maxLines={30}
                minLines={10}
                sectionName="introdução"
                placeholder="Digite a introdução do artigo..."
              />
            </div>

            {/* Desenvolvimento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2 Desenvolvimento</h3>
              <RichTextEditor
                value={content.development}
                onChange={(value) => handleChange('development', value)}
                maxLines={100}
                minLines={20}
                sectionName="desenvolvimento"
                placeholder="Digite o desenvolvimento do artigo..."
              />
            </div>

            {/* Conclusão */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3 Conclusão</h3>
              <RichTextEditor
                value={content.conclusion}
                onChange={(value) => handleChange('conclusion', value)}
                maxLines={20}
                minLines={5}
                sectionName="conclusão"
                placeholder="Digite a conclusão do artigo..."
              />
            </div>

            {/* Referências */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Referências</h3>
              <RichTextEditor
                value={content.references}
                onChange={(value) => handleChange('references', value)}
                maxLines={50}
                minLines={5}
                sectionName="referências"
                placeholder="Digite as referências do artigo..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ArticleEditor;
