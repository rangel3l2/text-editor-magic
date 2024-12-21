import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RichTextEditor from '../../RichTextEditor';
import editorConfig from '@/config/editorConfig';

interface InstitutionInputProps {
  institution: string;
  handleChange: (field: string, value: string) => void;
}

const InstitutionInput = ({ institution, handleChange }: InstitutionInputProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Nome da Instituição</CardTitle>
        <CardDescription>Digite o nome completo da instituição (2-3 linhas)</CardDescription>
      </CardHeader>
      <CardContent>
        <RichTextEditor
          value={institution}
          onChange={(data) => handleChange('institution', data)}
          maxLines={3}
          minLines={2}
          config={editorConfig}
          placeholder="Digite o nome completo da instituição..."
        />
      </CardContent>
    </Card>
  );
};

export default InstitutionInput;