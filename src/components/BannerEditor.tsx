import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const BannerEditor = () => {
  const [bannerContent, setBannerContent] = useState({
    title: '',
    authors: '',
    introduction: '',
    objectives: '',
    methodology: '',
    results: '',
    conclusion: '',
    references: '',
    acknowledgments: ''
  });
  
  const { toast } = useToast();
  
  const handleChange = (field: string, data: string) => {
    setBannerContent(prev => ({
      ...prev,
      [field]: data
    }));
    
    localStorage.setItem('bannerContent', JSON.stringify({
      ...bannerContent,
      [field]: data
    }));
    
    toast({
      title: "Content saved",
      description: "Your banner content has been automatically saved",
      duration: 2000,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Título do Trabalho</CardTitle>
          <CardDescription>Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (1 linha, fonte 50-70pts)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.title}
            onChange={(_event, editor) => {
              handleChange('title', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', '|', 'undo', 'redo'],
              placeholder: "Digite um título breve e atrativo que indique o tema principal do trabalho..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Autores e Instituição</CardTitle>
          <CardDescription>Liste os nomes dos autores, seguidos da afiliação institucional e e-mail de contato do autor principal. (2-3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.authors}
            onChange={(_event, editor) => {
              handleChange('authors', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'link', '|', 'undo', 'redo'],
              placeholder: "Nome dos autores, afiliação institucional e e-mail de contato..."
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Introdução</CardTitle>
          <CardDescription>Apresente uma visão geral do tema, incluindo problematização e objetivos gerais. (4-6 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.introduction}
            onChange={(_event, editor) => {
              handleChange('introduction', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'bulletedList', '|', 'undo', 'redo'],
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
            data={bannerContent.objectives}
            onChange={(_event, editor) => {
              handleChange('objectives', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'bulletedList', '|', 'undo', 'redo'],
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
            data={bannerContent.methodology}
            onChange={(_event, editor) => {
              handleChange('methodology', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
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
            data={bannerContent.results}
            onChange={(_event, editor) => {
              handleChange('results', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
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
            data={bannerContent.conclusion}
            onChange={(_event, editor) => {
              handleChange('conclusion', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', '|', 'undo', 'redo'],
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
            data={bannerContent.references}
            onChange={(_event, editor) => {
              handleChange('references', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'link', '|', 'undo', 'redo'],
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
            data={bannerContent.acknowledgments}
            onChange={(_event, editor) => {
              handleChange('acknowledgments', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', '|', 'undo', 'redo'],
              placeholder: "Agradeça às instituições e pessoas que contribuíram..."
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerEditor;