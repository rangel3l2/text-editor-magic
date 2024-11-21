import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface BannerHeaderSectionProps {
  content: {
    title: string;
    authors: string;
  };
  handleChange: (field: string, data: string) => void;
}

const BannerHeaderSection = ({ content, handleChange }: BannerHeaderSectionProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Título do Trabalho</CardTitle>
          <CardDescription>Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (1 linha, fonte 50-70pts)</CardDescription>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={content.title}
            onChange={(_event, editor) => {
              handleChange('title', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', '|', 'undo', 'redo'],
              placeholder: "Digite um título breve e atrativo que indique o tema principal do trabalho...",
              removePlugins: ['Logo']
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
            data={content.authors}
            onChange={(_event, editor) => {
              handleChange('authors', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'link', '|', 'undo', 'redo'],
              placeholder: "Nome dos autores, afiliação institucional e e-mail de contato...",
              removePlugins: ['Logo']
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerHeaderSection;