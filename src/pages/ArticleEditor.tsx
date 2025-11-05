
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor";
import { useArticleContent, ArticleContent } from "@/hooks/useArticleContent";
import { Separator } from "@/components/ui/separator";
import ArticlePreviewPaginated from "@/components/article/ArticlePreviewPaginated";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import EditorHeader from "@/components/editor/EditorHeader";
import { toast } from "@/components/ui/use-toast";
import TheoreticalFramework from "@/components/article/TheoreticalFramework";
import IntroductionEditor from "@/components/academic/IntroductionEditor";
import AcademicAdvisor from "@/components/article/AcademicAdvisor";
import { ArticleTestUpload } from "@/components/article/ArticleTestUpload";
import { useIsAdmin } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import ValidationToggleButton from "@/components/editor/ValidationToggleButton";

const ArticleEditor = () => {
  const { user } = useAuth();
  const { content, isLoading, loadError, handleChange, addTheoreticalTopic, updateTheoreticalTopic, removeTheoreticalTopic } = useArticleContent();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin(user);

  const handleArticleParsed = (parsedContent: Partial<ArticleContent>) => {
    // Preencher todos os campos com o conteúdo extraído
    Object.entries(parsedContent).forEach(([key, value]) => {
      if (value) {
        handleChange(key as keyof ArticleContent, value);
      }
    });

    toast({
      title: "Artigo importado!",
      description: "Todos os campos foram preenchidos automaticamente. Revise o conteúdo.",
    });
  };

  const handleDownload = async () => {
    // Validar se há conteúdo mínimo
    if (!content.title || !content.abstract) {
      toast({
        title: "Conteúdo incompleto",
        description: "Preencha pelo menos o título e o resumo antes de gerar o PDF.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Gerando LaTeX...",
        description: "Aguarde enquanto preparamos seu artigo científico.",
      });

      const { data, error } = await supabase.functions.invoke('generate-article-latex', {
        body: { content }
      });

      if (error) throw error;

      if (data?.latex) {
        // Criar arquivo .tex para download
        const blob = new Blob([data.latex], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${content.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'artigo'}.tex`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "LaTeX gerado com sucesso!",
          description: "Código LaTeX baixado. Cole em Overleaf.com ou TeXstudio para gerar o PDF com formatação ABNT completa.",
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar LaTeX:', error);
      toast({
        title: "Erro ao gerar LaTeX",
        description: "Não foi possível gerar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando trabalho...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loadError) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="text-destructive text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold">Erro ao carregar trabalho</h2>
            <p className="text-muted-foreground">{loadError}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <EditorHeader
            title={content.title || "Novo Artigo Científico"}
            onDownload={handleDownload}
            onShare={handleShare}
            onPreview={() => setPreviewOpen(true)}
            onClear={handleClear}
            adminButton={isAdmin ? <ArticleTestUpload onArticleParsed={handleArticleParsed} /> : undefined}
          />
          <ValidationToggleButton />
        </div>

        {/* Orientação Acadêmica */}
        <div className="mb-6">
          <AcademicAdvisor 
            currentSection="artigo científico"
            articleContent={content}
          />
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
            <ArticlePreviewPaginated content={content} />
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
                    maxLines={100}
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
