
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useMonographyContent } from "@/hooks/useMonographyContent";
import { useState } from "react";
import EditorHeader from "@/components/editor/EditorHeader";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MonographyPreview from "@/components/monography/MonographyPreview";
import RichTextEditor from "@/components/RichTextEditor";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TheoreticalFramework from "@/components/article/TheoreticalFramework";

const MonographyEditor = () => {
  const { 
    content, 
    handleChange, 
    addTheoreticalTopic, 
    updateTheoreticalTopic, 
    removeTheoreticalTopic 
  } = useMonographyContent();
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
          title="Nova Monografia"
          onDownload={handleDownload}
          onShare={handleShare}
          onPreview={() => setPreviewOpen(true)}
          onClear={handleClear}
        />

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
            <MonographyPreview content={content} />
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
                {/* Capa */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Capa</h3>
                  <RichTextEditor
                    value={content.institution}
                    onChange={(value) => handleChange('institution', value)}
                    maxLines={2}
                    minLines={1}
                    sectionName="instituição"
                    placeholder="Nome da instituição..."
                  />
                  <RichTextEditor
                    value={content.campus}
                    onChange={(value) => handleChange('campus', value)}
                    maxLines={1}
                    minLines={1}
                    sectionName="campus"
                    placeholder="Nome do campus..."
                  />
                  <RichTextEditor
                    value={content.authors}
                    onChange={(value) => handleChange('authors', value)}
                    maxLines={4}
                    minLines={1}
                    sectionName="autores"
                    placeholder="Nome do(s) autor(es)..."
                  />
                  <RichTextEditor
                    value={content.title}
                    onChange={(value) => handleChange('title', value)}
                    maxLines={3}
                    minLines={1}
                    sectionName="título"
                    placeholder="Título do trabalho..."
                  />
                  <RichTextEditor
                    value={content.subtitle}
                    onChange={(value) => handleChange('subtitle', value)}
                    maxLines={2}
                    minLines={0}
                    sectionName="subtítulo"
                    placeholder="Subtítulo (se houver)..."
                  />
                  <RichTextEditor
                    value={content.location}
                    onChange={(value) => handleChange('location', value)}
                    maxLines={1}
                    minLines={1}
                    sectionName="local"
                    placeholder="Local..."
                  />
                  <RichTextEditor
                    value={content.year}
                    onChange={(value) => handleChange('year', value)}
                    maxLines={1}
                    minLines={1}
                    sectionName="ano"
                    placeholder="Ano..."
                  />
                </div>

                <Separator />

                {/* Folha de Rosto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Folha de Rosto</h3>
                  <RichTextEditor
                    value={content.workNature}
                    onChange={(value) => handleChange('workNature', value)}
                    maxLines={5}
                    minLines={2}
                    sectionName="natureza"
                    placeholder="Natureza do trabalho (tipo, objetivo, instituição, área)..."
                  />
                  <RichTextEditor
                    value={content.advisor}
                    onChange={(value) => handleChange('advisor', value)}
                    maxLines={2}
                    minLines={1}
                    sectionName="orientador"
                    placeholder="Nome e titulação do orientador..."
                  />
                  <RichTextEditor
                    value={content.coAdvisor}
                    onChange={(value) => handleChange('coAdvisor', value)}
                    maxLines={2}
                    minLines={0}
                    sectionName="coorientador"
                    placeholder="Nome e titulação do coorientador (se houver)..."
                  />
                </div>

                <Separator />

                {/* Resumo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Resumo</h3>
                  <RichTextEditor
                    value={content.abstract}
                    onChange={(value) => handleChange('abstract', value)}
                    maxLines={30}
                    minLines={10}
                    sectionName="resumo"
                    placeholder="Digite o resumo (150 a 500 palavras)..."
                  />
                  <RichTextEditor
                    value={content.keywords}
                    onChange={(value) => handleChange('keywords', value)}
                    maxLines={2}
                    minLines={1}
                    sectionName="palavras-chave"
                    placeholder="Palavras-chave (3 a 5, separadas por ponto)..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="textual">
            <Card>
              <CardContent className="space-y-6">
                {/* Introdução */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">1 INTRODUÇÃO</h3>
                  <RichTextEditor
                    value={content.introduction}
                    onChange={(value) => handleChange('introduction', value)}
                    maxLines={50}
                    minLines={10}
                    sectionName="introdução"
                    placeholder="Digite a introdução..."
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

                {/* Desenvolvimento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {2 + content.theoreticalTopics.length} DESENVOLVIMENTO
                  </h3>
                  <RichTextEditor
                    value={content.development}
                    onChange={(value) => handleChange('development', value)}
                    maxLines={200}
                    minLines={50}
                    sectionName="desenvolvimento"
                    placeholder="Digite o desenvolvimento..."
                  />
                </div>

                <Separator />

                {/* Conclusão */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {3 + content.theoreticalTopics.length} CONCLUSÃO
                  </h3>
                  <RichTextEditor
                    value={content.conclusion}
                    onChange={(value) => handleChange('conclusion', value)}
                    maxLines={30}
                    minLines={10}
                    sectionName="conclusão"
                    placeholder="Digite a conclusão..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post-textual">
            <Card>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Referências</h3>
                  <RichTextEditor
                    value={content.references}
                    onChange={(value) => handleChange('references', value)}
                    maxLines={100}
                    minLines={5}
                    sectionName="referências"
                    placeholder="Digite as referências..."
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

export default MonographyEditor;
