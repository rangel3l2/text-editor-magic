import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Progress } from "@/components/ui/progress";
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  config?: any;
  placeholder?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  maxLines = 10, 
  config = {}, 
  placeholder 
}: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const calculateProgress = (text: string) => {
    const lines = text.split('\n').length;
    const chars = text.length;
    const avgCharsPerLine = 80;
    const estimatedLines = Math.ceil(chars / avgCharsPerLine);
    const actualLines = Math.max(lines, estimatedLines);
    const percentage = Math.min((actualLines / maxLines) * 100, 100);
    setProgress(percentage);
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Verificar o tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB",
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }

      // Criar uma URL temporária para a imagem
      const imageUrl = URL.createObjectURL(file);

      // Converter a imagem para base64 para salvar no documento
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(imageUrl);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer upload da imagem",
        description: "Não foi possível fazer o upload da imagem. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }
  };

  const editorConfig = {
    ...config,
    placeholder: placeholder || `Digite aqui (máximo ${maxLines} linhas)...`,
    image: {
      ...config.image,
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageTextAlternative',
        '|',
        'resizeImage:25',
        'resizeImage:50',
        'resizeImage:75',
        'resizeImage:original',
        '|',
        'imageCrop'
      ],
      resizeOptions: [
        {
          name: '25',
          value: '25',
          label: '25%'
        },
        {
          name: '50',
          value: '50',
          label: '50%'
        },
        {
          name: '75',
          value: '75',
          label: '75%'
        },
        {
          name: 'original',
          value: null,
          label: 'Original'
        }
      ],
      upload: {
        types: ['jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'],
        handler: handleImageUpload
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 rounded-lg">
        <CKEditor
          editor={ClassicEditor}
          data={value}
          onChange={(_event, editor) => {
            const data = editor.getData();
            onChange(data);
            calculateProgress(data.replace(/<[^>]*>/g, ''));
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          config={editorConfig}
        />
      </div>
      {isFocused && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 text-right">
            {Math.min(Math.round(progress), 100)}% do limite
          </p>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;