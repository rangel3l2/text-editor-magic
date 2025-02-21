
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";
import { useMonographyContent } from "@/hooks/useMonographyContent";
import { Separator } from "@/components/ui/separator";
import MonographyPreview from "@/components/monography/MonographyPreview";
import { useState } from "react";
import { Eye } from "lucide-react";

const MonographyEditor = () => {
  const { user } = useAuth();
  const { content, handleChange } = useMonographyContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Editor de Monografia</h2>
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
          <MonographyPreview content={content} />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Editor de Monografia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Elementos Pré-textuais */}
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

          {/* Elementos Textuais */}
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

          <Separator />

          {/* Elementos Textuais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1 Introdução</h3>
            <RichTextEditor
              value={content.introduction}
              onChange={(value) => handleChange('introduction', value)}
              maxLines={50}
              minLines={10}
              sectionName="introdução"
              placeholder="Digite a introdução..."
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2 Desenvolvimento</h3>
            <RichTextEditor
              value={content.development}
              onChange={(value) => handleChange('development', value)}
              maxLines={200}
              minLines={50}
              sectionName="desenvolvimento"
              placeholder="Digite o desenvolvimento..."
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3 Conclusão</h3>
            <RichTextEditor
              value={content.conclusion}
              onChange={(value) => handleChange('conclusion', value)}
              maxLines={30}
              minLines={10}
              sectionName="conclusão"
              placeholder="Digite a conclusão..."
            />
          </div>

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
    </div>
  );
};

export default MonographyEditor;
