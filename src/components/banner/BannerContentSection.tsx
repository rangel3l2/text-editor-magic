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
          <CardDescription>Apresente uma visão geral do tema, incluindo problematização e objetivos gerais. (6-8 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.introduction}
            onChange={(data) => handleChange('introduction', data)}
            maxLines={8}
            config={editorConfig}
            placeholder="Apresente o tema, contexto e problematização do trabalho..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Objetivos</CardTitle>
          <CardDescription>Informe os objetivos gerais e específicos do trabalho. Use frases curtas e diretas.</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.objectives}
            onChange={(data) => handleChange('objectives', data)}
            maxLines={3}
            config={editorConfig}
            placeholder="Liste os objetivos gerais e específicos do trabalho..."
            isObjectives={true}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Metodologia</CardTitle>
          <CardDescription>Explique o método utilizado, destacando as etapas principais. (4-6 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.methodology}
            onChange={(data) => handleChange('methodology', data)}
            maxLines={6}
            config={editorConfig}
            placeholder="Descreva os métodos e procedimentos utilizados..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Resultados e Discussão</CardTitle>
          <CardDescription>Apresente os principais resultados e compare com a literatura. Use gráficos ou tabelas. (3-4 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.results}
            onChange={(data) => handleChange('results', data)}
            maxLines={4}
            config={editorConfig}
            placeholder="Apresente os principais resultados obtidos e sua discussão..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Conclusão</CardTitle>
          <CardDescription>Resuma as principais descobertas e contribuições do trabalho. (3-4 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.conclusion}
            onChange={(data) => handleChange('conclusion', data)}
            maxLines={4}
            config={editorConfig}
            placeholder="Apresente as principais conclusões e contribuições do trabalho..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Referências</CardTitle>
          <CardDescription>Liste 2-3 referências mais relevantes, seguindo as normas ABNT. (2-3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.references}
            onChange={(data) => handleChange('references', data)}
            maxLines={3}
            config={editorConfig}
            placeholder="Liste as referências mais relevantes (ABNT)..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Agradecimentos (opcional)</CardTitle>
          <CardDescription>Mencione instituições ou pessoas que contribuíram para o trabalho. (1-2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.acknowledgments}
            onChange={(data) => handleChange('acknowledgments', data)}
            maxLines={2}
            config={editorConfig}
            placeholder="Agradeça às instituições e pessoas que contribuíram..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerContentSection;
