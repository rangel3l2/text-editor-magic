import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RichTextEditor from '../RichTextEditor';
import editorConfig from '@/config/editorConfig';
import SectionAttachmentIndicator from './SectionAttachmentIndicator';
import { useBannerImages } from '@/hooks/useBannerImages';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';

interface BannerContentSectionProps {
  content: {
    introduction: string;
    objectives: string;
    methodology: string;
    results: string;
    discussion: string;
    conclusion: string;
    references: string;
    acknowledgments: string;
  };
  handleChange: (field: string, data: string) => void;
  onImageUploadFromEditor?: (file: File) => void;
}

const BannerContentSection = ({ content, handleChange, onImageUploadFromEditor }: BannerContentSectionProps) => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const { images } = useBannerImages(workId, user?.id);

  // Filter attachments by section
  const introAttachments = images.filter(img => img.section === 'introduction').sort((a, b) => a.display_order - b.display_order);
  const objectivesAttachments = images.filter(img => img.section === 'objectives').sort((a, b) => a.display_order - b.display_order);
  const methodologyAttachments = images.filter(img => img.section === 'methodology').sort((a, b) => a.display_order - b.display_order);
  const resultsAttachments = images.filter(img => img.section === 'results').sort((a, b) => a.display_order - b.display_order);
  const discussionAttachments = images.filter(img => img.section === 'discussion').sort((a, b) => a.display_order - b.display_order);
  const conclusionAttachments = images.filter(img => img.section === 'conclusion').sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">📐 Estrutura do Banner Científico</h3>
        <p className="text-sm text-muted-foreground">
          Seu banner será organizado em 3 colunas profissionais:
        </p>
        <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
          <div className="bg-background p-3 rounded border">
            <p className="font-semibold">Coluna 1</p>
            <p className="text-muted-foreground">Introdução • Objetivos • Referências</p>
          </div>
          <div className="bg-background p-3 rounded border">
            <p className="font-semibold">Coluna 2</p>
            <p className="text-muted-foreground">Metodologia • Resultados (início)</p>
          </div>
          <div className="bg-background p-3 rounded border">
            <p className="font-semibold">Coluna 3</p>
            <p className="text-muted-foreground">Resultados • Discussão • Conclusão • Agradecimentos</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introdução</CardTitle>
          <CardDescription>
            Contextualize o tema e apresente a problemática. Seja objetivo e claro. (Recomendado: 10-20 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionAttachmentIndicator 
            sectionName="Introdução"
            attachments={introAttachments}
          />
          <RichTextEditor
            value={content.introduction}
            onChange={(data) => handleChange('introduction', data)}
            maxLines={30}
            minLines={5}
            config={editorConfig}
            placeholder="Ex: A problemática dos resíduos plásticos tem afetado significativamente os ecossistemas marinhos..."
            sectionName="Introdução"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos</CardTitle>
          <CardDescription>
            Liste os objetivos gerais e específicos. Use tópicos claros e diretos. (Recomendado: 5-10 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionAttachmentIndicator 
            sectionName="Objetivos"
            attachments={objectivesAttachments}
          />
          <RichTextEditor
            value={content.objectives}
            onChange={(data) => handleChange('objectives', data)}
            maxLines={15}
            minLines={2}
            config={editorConfig}
            placeholder="Ex: • Objetivo Geral: Avaliar o impacto... • Objetivos Específicos: 1) Quantificar... 2) Analisar..."
            sectionName="Objetivos"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metodologia / Materiais e Métodos</CardTitle>
          <CardDescription>
            Descreva os procedimentos, materiais e técnicas utilizadas. Seja específico. (Recomendado: 15-25 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionAttachmentIndicator 
            sectionName="Metodologia"
            attachments={methodologyAttachments}
          />
          <RichTextEditor
            value={content.methodology}
            onChange={(data) => handleChange('methodology', data)}
            maxLines={35}
            minLines={5}
            config={{
              ...editorConfig,
              toolbar: editorConfig.toolbar.filter((t: any) => t !== 'imageUpload')
            }}
            placeholder="Ex: O estudo foi conduzido em três etapas: 1) Coleta de amostras... 2) Análise laboratorial... 3) Tratamento estatístico..."
            sectionName="Metodologia"
            onCustomImageUpload={onImageUploadFromEditor}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Apresente os principais dados e resultados obtidos. Use gráficos e tabelas quando possível. (Recomendado: 15-25 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionAttachmentIndicator 
            sectionName="Resultados"
            attachments={resultsAttachments}
          />
          <RichTextEditor
            value={content.results}
            onChange={(data) => handleChange('results', data)}
            maxLines={35}
            minLines={5}
            config={{
              ...editorConfig,
              toolbar: editorConfig.toolbar.filter((t: any) => t !== 'imageUpload')
            }}
            placeholder="Ex: Os resultados demonstraram que... A Figura 1 ilustra... A Tabela 1 apresenta..."
            sectionName="Resultados"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discussão</CardTitle>
          <CardDescription>
            Compare seus resultados com a literatura e explique suas implicações. (Recomendado: 10-20 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionAttachmentIndicator 
            sectionName="Discussão"
            attachments={discussionAttachments}
          />
          <RichTextEditor
            value={content.discussion}
            onChange={(data) => handleChange('discussion', data)}
            maxLines={30}
            minLines={5}
            config={editorConfig}
            placeholder="Ex: Os resultados obtidos corroboram com os estudos de Silva et al. (2022), que também observaram..."
            sectionName="Discussão"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conclusões</CardTitle>
          <CardDescription>
            Sintetize as principais descobertas e contribuições do trabalho. (Recomendado: 5-12 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionAttachmentIndicator 
            sectionName="Conclusão"
            attachments={conclusionAttachments}
          />
          <RichTextEditor
            value={content.conclusion}
            onChange={(data) => handleChange('conclusion', data)}
            maxLines={18}
            minLines={3}
            config={editorConfig}
            placeholder="Ex: Conclui-se que a metodologia proposta foi eficaz para... Os resultados sugerem que..."
            sectionName="Conclusão"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Referências</CardTitle>
          <CardDescription>Liste 2-3 referências mais relevantes, seguindo as normas ABNT. (2-10 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.references}
            onChange={(data) => handleChange('references', data)}
            maxLines={10}
            minLines={2}
            config={editorConfig}
            placeholder="Liste as referências mais relevantes (ABNT)..."
            sectionName="Referências"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Agradecimentos (opcional)</CardTitle>
          <CardDescription>Mencione instituições ou pessoas que contribuíram para o trabalho. (máximo 4 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.acknowledgments}
            onChange={(data) => handleChange('acknowledgments', data)}
            maxLines={4}
            minLines={0}
            config={editorConfig}
            placeholder="Agradeça às instituições e pessoas que contribuíram..."
            sectionName="Agradecimentos"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerContentSection;