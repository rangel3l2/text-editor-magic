import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RichTextEditor from '../RichTextEditor';
import editorConfig from '@/config/editorConfig';

interface BannerContentSectionProps {
  content: {
    introduction: string;
    objectives: string;
    methodology: string;
    results: string;
    conclusion: string;
    references: string;
    acknowledgments: string;
  };
  handleChange: (field: string, data: string) => void;
}

const BannerContentSection = ({ content, handleChange }: BannerContentSectionProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>3. Introdução</CardTitle>
          <CardDescription>Apresente uma visão geral do tema, incluindo problematização e objetivos gerais. (5-25 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.introduction}
            onChange={(data) => handleChange('introduction', data)}
            maxLines={25}
            minLines={5}
            config={editorConfig}
            placeholder="Apresente o tema, contexto e problematização do trabalho..."
            sectionName="Introdução"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Objetivos</CardTitle>
          <CardDescription>Informe os objetivos gerais e específicos do trabalho. Use frases curtas e diretas. (2-10 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.objectives}
            onChange={(data) => handleChange('objectives', data)}
            maxLines={10}
            minLines={2}
            config={editorConfig}
            placeholder="Liste os objetivos gerais e específicos do trabalho..."
            sectionName="Objetivos"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Metodologia</CardTitle>
          <CardDescription>Explique o método utilizado, destacando as etapas principais. (5-25 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.methodology}
            onChange={(data) => handleChange('methodology', data)}
            maxLines={25}
            minLines={5}
            config={editorConfig}
            placeholder="Descreva os métodos e procedimentos utilizados..."
            sectionName="Metodologia"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Resultados e Discussão</CardTitle>
          <CardDescription>Apresente os principais resultados e compare com a literatura. Use gráficos ou tabelas. (5-25 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.results}
            onChange={(data) => handleChange('results', data)}
            maxLines={25}
            minLines={5}
            config={editorConfig}
            placeholder="Apresente os principais resultados obtidos e sua discussão..."
            sectionName="Resultados"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Conclusão</CardTitle>
          <CardDescription>Resuma as principais descobertas e contribuições do trabalho. (3-15 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.conclusion}
            onChange={(data) => handleChange('conclusion', data)}
            maxLines={15}
            minLines={3}
            config={editorConfig}
            placeholder="Apresente as principais conclusões e contribuições do trabalho..."
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