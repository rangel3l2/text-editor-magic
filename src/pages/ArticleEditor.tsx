
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
import { WorkImporter } from "@/components/WorkImporter";
import { supabase } from "@/integrations/supabase/client";
import ValidationToggleButton from "@/components/editor/ValidationToggleButton";
import ArticleAttachmentsManager from "@/components/article/ArticleAttachmentsManager";
import ArticleSummary from "@/components/article/ArticleSummary";
import EditorSidebar from "@/components/editor/EditorSidebar";
import GuidelinesViewer from "@/components/editor/GuidelinesViewer";

const ArticleEditor = () => {
  const { user } = useAuth();
  const { content, isLoading, loadError, handleChange, updateMultipleFields, addTheoreticalTopic, updateTheoreticalTopic, removeTheoreticalTopic } = useArticleContent();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pre-textual" | "textual" | "post-textual">("pre-textual");
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleArticleParsed = (parsedContent: Partial<ArticleContent>) => {
    // Atualizar todos os campos de uma só vez para evitar múltiplos re-renders
    updateMultipleFields(parsedContent);

    toast({
      title: "Artigo importado!",
      description: "Todos os campos foram preenchidos automaticamente. Revise o conteúdo.",
    });
  };

  const handleOverleaf = async () => {
    if (!content.title || !content.abstract) {
      toast({
        title: "Conteúdo incompleto",
        description: "Preencha pelo menos o título e o resumo antes de abrir no Overleaf.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Preparando projeto",
        description: "Carregando no Overleaf...",
        duration: 2000,
      });

      const { data, error } = await supabase.functions.invoke('generate-article-latex', {
        body: { content }
      });

      if (error) throw error;

      if (data?.latex) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.overleaf.com/docs';
        form.target = '_blank';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'snip_uri';
        
        const blob = new Blob([data.latex], { type: 'text/plain' });
        const reader = new FileReader();
        
        reader.onload = () => {
          input.value = reader.result as string;
          form.appendChild(input);
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
          
          toast({
            title: "✅ Projeto aberto no Overleaf!",
            description: "No Overleaf, clique em 'Recompilar' para gerar o PDF.",
            duration: 8000,
          });
        };
        
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error('Erro ao abrir no Overleaf:', error);
      toast({
        title: "Erro ao abrir Overleaf",
        description: "Use o botão 'Baixar LaTeX' e faça upload manual.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    if (!content.title || !content.abstract) {
      toast({
        title: "Conteúdo incompleto",
        description: "Preencha pelo menos o título e o resumo antes de gerar o LaTeX.",
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
          description: "Arquivo .tex baixado.",
          duration: 5000,
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
      {/* Sidebar */}
      <EditorSidebar
        onOverleaf={handleOverleaf}
        onDownload={handleDownload}
        onShare={handleShare}
        onPreview={() => setPreviewOpen(true)}
        onShowGuidelines={() => setGuidelinesOpen(true)}
        importButton={<WorkImporter workType="article" onWorkParsed={handleArticleParsed} />}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Diálogo de Regras IFMS */}
      <GuidelinesViewer
        open={guidelinesOpen}
        onOpenChange={setGuidelinesOpen}
        workType="article"
        universityId="ifms"
      />

      <div 
        className="transition-all duration-300 pb-20 md:pb-0" 
        style={{ marginLeft: sidebarCollapsed ? '0' : '0' }}
      >
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6" style={{ marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? '4rem' : '16rem') : '0' }}>
          <h1 className="text-xl md:text-2xl font-bold">
            {content.title ? content.title.replace(/<[^>]*>/g, '').trim() : "Novo Artigo Científico"}
          </h1>
          <div className="flex items-center justify-end gap-2 md:gap-4">
            <ValidationToggleButton />
          </div>

      {/* Sumário de navegação */}
      <ArticleSummary
          theoreticalTopicsCount={content.theoreticalTopics.length}
          onNavigate={(sectionId) => {
            let targetTab: "pre-textual" | "textual" | "post-textual" = "pre-textual";

            if (
              sectionId === "article-introduction" ||
              sectionId.startsWith("article-theoretical-") ||
              sectionId === "article-methodology" ||
              sectionId === "article-results" ||
              sectionId === "article-conclusion"
            ) {
              targetTab = "textual";
            } else if (
              sectionId === "article-references" ||
              sectionId === "article-appendices" ||
              sectionId === "article-attachments"
            ) {
              targetTab = "post-textual";
            } else {
              targetTab = "pre-textual";
            }

            const scrollTo = () => {
              const element = document.getElementById(sectionId);
              if (element) {
                const headerOffset = 100;
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                  top: elementPosition - headerOffset,
                  behavior: "smooth",
                });
              }
            };

            if (activeTab !== targetTab) {
              setActiveTab(targetTab);
              setTimeout(scrollTo, 100);
            } else {
              scrollTo();
            }
          }}
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
            <ArticlePreviewPaginated content={content} />
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pre-textual" | "textual" | "post-textual")} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pre-textual">Elementos Pré-textuais</TabsTrigger>
            <TabsTrigger value="textual">Elementos Textuais</TabsTrigger>
            <TabsTrigger value="post-textual">Elementos Pós-textuais</TabsTrigger>
          </TabsList>

          <TabsContent value="pre-textual">
            <Card>
              <CardContent className="space-y-6">
                {/* Título e Subtítulo */}
                <div id="article-title" className="space-y-4 scroll-mt-20">
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
                <div id="article-authors" className="space-y-4 scroll-mt-20">
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
                <div id="article-abstract" className="space-y-4 scroll-mt-20">
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
                <div id="article-introduction" className="space-y-4 scroll-mt-20">
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
                <div id="article-methodology" className="space-y-4 scroll-mt-20">
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
                <div id="article-results" className="space-y-4 scroll-mt-20">
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
                <div id="article-conclusion" className="space-y-4 scroll-mt-20">
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
                <div id="article-references" className="space-y-4 scroll-mt-20">
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
                <div id="article-appendices" className="space-y-4 scroll-mt-20">
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
                <div id="article-attachments" className="space-y-4 scroll-mt-20">
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

        {/* Gerenciador de Anexos */}
        <ArticleAttachmentsManager />
        </div>
      </div>
    </MainLayout>
  );
};

export default ArticleEditor;
