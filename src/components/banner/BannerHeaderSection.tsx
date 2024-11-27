import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ProgressEditor from '../ProgressEditor';
import editorConfig from '@/config/editorConfig';

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
          <CardDescription>Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressEditor
            value={content.title}
            onChange={(data) => handleChange('title', data)}
            maxLines={2}
            config={editorConfig}
            placeholder="Digite um título breve e atrativo que indique o tema principal do trabalho..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Autores e Instituição</CardTitle>
          <CardDescription>Liste os nomes dos autores, seguidos da afiliação institucional e e-mail de contato do autor principal. (3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressEditor
            value={content.authors}
            onChange={(data) => handleChange('authors', data)}
            maxLines={3}
            config={editorConfig}
            placeholder="Nome dos autores, afiliação institucional e e-mail de contato..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerHeaderSection;