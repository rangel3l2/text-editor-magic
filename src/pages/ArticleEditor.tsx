
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor";
import { useArticleContent } from "@/hooks/useArticleContent";
import { Separator } from "@/components/ui/separator";
import ArticlePreview from "@/components/article/ArticlePreview";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import EditorHeader from "@/components/editor/EditorHeader";
import { toast } from "@/components/ui/use-toast";
import TheoreticalFramework from "@/components/article/TheoreticalFramework";
import IntroductionEditor from "@/components/academic/IntroductionEditor";
import AcademicAdvisor from "@/components/article/AcademicAdvisor";

const ArticleEditor = () => {
  const { user } = useAuth();
  const { content, handleChange, addTheoreticalTopic, updateTheoreticalTopic, removeTheoreticalTopic } = useArticleContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDownload = () => {
    toast({
      title: "Download",
      description: "Função de download em desenvolvimento...",
    });
  };

  const handleShare = () => {
    toast({
      title: "Compartilhar",
      description: "Função de compartilhamento em desenvolvimento...",
    });
  };

  const handleClear = () => {
    toast({
      title: "Limpar",
      description: "Todos os campos foram limpos.",
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <EditorHeader
          title="Novo Artigo Científico"
          onDownload={handleDownload}
          onShare={handleShare}
          onPreview={() => setPreviewOpen(true)}
          onClear={handleClear}
        />

        {/* Orientação Acadêmica */}
        <div className="mb-6">
          <AcademicAdvisor 
            currentSection="artigo científico"
            articleContent={content}
          />
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
            <ArticlePreview content={content} />
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="pre-textual" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pre-textual">Elementos Pré-textuais</TabsTrigger>
            <TabsTrigger value="textual">Elementos Textuais</TabsTrigger>
            <TabsTrigger value="post-textual">Elementos Pós-textuais</TabsTrigger>
          </TabsList>

          <TabsContent value="pre-textual">
            <Card>
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

                {/* Autores e Instituição */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Autores e Instituição</h3>
                  <RichTextEditor
                    value={content.authors}
                    onChange={(value) => handleChange('authors', value)}
                    maxLines={4}
                    minLines={1}
                    sectionName="autores"
                    placeholder="Digite os nomes dos autores (um por linha)..."
                  />
                  <RichTextEditor
                    value={content.institution}
                    onChange={(value) => handleChange('institution', value)}
                    maxLines={2}
                    minLines={1}
                    sectionName="instituição"
                    placeholder="Digite o nome da instituição..."
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

                {/* Resumo em Português */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Resumo</h3>
                  <RichTextEditor
                    value={content.abstract}
                    onChange={(value) => handleChange('abstract', value)}
                    maxLines={40}
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
                    maxLines={40}
                    minLines={5}
                    sectionName="abstract"
                    placeholder="Type the abstract (100 to 250 words)..."
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="textual">
            <Card>
              <CardContent className="space-y-6">
                {/* Introdução com editor guiado */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">1. Introdução</h3>
                  <IntroductionEditor
                    value={content.introduction}
                    onChange={(value) => handleChange('introduction', value)}
                    maxLines={30}
                    minLines={10}
                  />
                </div>

                <Separator />

                {/* Referencial Teórico */}
                <TheoreticalFramework
                  topics={content.theoreticalTopics}
                  onAddTopic={addTheoreticalTopic}
                  onUpdateTopic={updateTheoreticalTopic}
                  onRemoveTopic={removeTheoreticalTopic}
                />

                <Separator />

                {/* Metodologia */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {2 + content.theoreticalTopics.length}. Metodologia
                  </h3>
                  <RichTextEditor
                    value={content.methodology}
                    onChange={(value) => handleChange('methodology', value)}
                    maxLines={30}
                    minLines={10}
                    sectionName="metodologia"
                    placeholder="Digite a metodologia..."
                  />
                </div>

                <Separator />

                {/* 2.3 Resultados e Discussão */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    2.{content.theoreticalTopics.length + 1} Resultados e Discussão
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Apresente os dados coletados de forma objetiva e depois interprete-os, 
                    comparando com a literatura da Fundamentação Teórica. Use tabelas, 
                    gráficos ou quadros (formato ABNT).
                  </p>
                  <RichTextEditor
                    value={content.results}
                    onChange={(value) => handleChange('results', value)}
                    maxLines={70}
                    minLines={15}
                    sectionName="Resultados e Discussão"
                    placeholder="Apresente os resultados obtidos e discuta-os comparando com os autores da fundamentação teórica..."
                  />
                </div>

                <Separator />

                {/* 3 Conclusão */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    3 Conclusão
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Retome os objetivos, sintetize os principais achados, 
                    indique limitações e sugira trabalhos futuros.
                  </p>
                  <RichTextEditor
                    value={content.conclusion}
                    onChange={(value) => handleChange('conclusion', value)}
                    maxLines={25}
                    minLines={5}
                    sectionName="Conclusão"
                    placeholder="Digite a conclusão do artigo..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post-textual">
            <Card>
              <CardContent className="space-y-6">
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

                <Separator />

                {/* Apêndices */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Apêndices</h3>
                  <RichTextEditor
                    value={content.appendices}
                    onChange={(value) => handleChange('appendices', value)}
                    maxLines={30}
                    minLines={0}
                    sectionName="apêndices"
                    placeholder="Digite os apêndices (se houver)..."
                  />
                </div>

                <Separator />

                {/* Anexos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Anexos</h3>
                  <RichTextEditor
                    value={content.attachments}
                    onChange={(value) => handleChange('attachments', value)}
                    maxLines={30}
                    minLines={0}
                    sectionName="anexos"
                    placeholder="Digite os anexos (se houver)..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ArticleEditor;
