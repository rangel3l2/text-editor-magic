import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
          <CardDescription>Apresente uma visão geral do tema, incluindo problematização e objetivos gerais. (4-6 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.introduction}
            onChange={(_event, editor) => {
              handleChange('introduction', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Apresente o tema, contexto e problematização do trabalho..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Objetivos</CardTitle>
          <CardDescription>Informe os objetivos gerais e específicos do trabalho. Use frases curtas e diretas. (2-3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.objectives}
            onChange={(_event, editor) => {
              handleChange('objectives', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Liste os objetivos gerais e específicos do trabalho..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Metodologia</CardTitle>
          <CardDescription>Explique o método utilizado, destacando as etapas principais. (3-5 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.methodology}
            onChange={(_event, editor) => {
              handleChange('methodology', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Descreva os métodos e procedimentos utilizados..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Resultados e Discussão</CardTitle>
          <CardDescription>Apresente os principais resultados e compare com a literatura. Use gráficos ou tabelas. (5-7 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.results}
            onChange={(_event, editor) => {
              handleChange('results', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Apresente os principais resultados obtidos e sua discussão..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Conclusão</CardTitle>
          <CardDescription>Resuma as principais descobertas e contribuições do trabalho. (3-4 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.conclusion}
            onChange={(_event, editor) => {
              handleChange('conclusion', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Apresente as principais conclusões e contribuições do trabalho..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Referências</CardTitle>
          <CardDescription>Liste 2-3 referências mais relevantes, seguindo as normas ABNT.</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.references}
            onChange={(_event, editor) => {
              handleChange('references', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Liste as referências mais relevantes (ABNT)..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Agradecimentos (opcional)</CardTitle>
          <CardDescription>Mencione instituições ou pessoas que contribuíram para o trabalho. (1-2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.acknowledgments}
            onChange={(_event, editor) => {
              handleChange('acknowledgments', editor.getData());
            }}
            config={{
              ...editorConfig,
              placeholder: "Agradeça às instituições e pessoas que contribuíram..."
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerContentSection;