import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Progress } from "@/components/ui/progress";
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';

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
    // Remove HTML tags for accurate character count
    const plainText = text.replace(/<[^>]*>/g, '');
    const chars = plainText.length;
    const lines = plainText.split('\n').length;
    const avgCharsPerLine = 80; // Aproximadamente 80 caracteres por linha
    const estimatedLines = Math.ceil(chars / avgCharsPerLine);
    const actualLines = Math.max(lines, estimatedLines);
    const percentage = Math.min((actualLines / maxLines) * 100, 100);
    setProgress(percentage);

    // Warn user when approaching the limit
    if (percentage >= 90 && percentage < 100) {
      toast({
        title: "Atenção",
        description: "Você está próximo do limite de texto para esta seção",
        duration: 3000,
      });
    } else if (percentage >= 100) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de texto para esta seção",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const maxSizeMB = 2;
      const maxWidthPx = 800; // ~7.5cm at 300dpi
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `A imagem deve ter no máximo ${maxSizeMB}MB`,
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }

      // Check image dimensions before upload
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width > maxWidthPx) {
            toast({
              title: "Imagem muito larga",
              description: "A largura da imagem deve ser menor que 800px (~7.5cm)",
              variant: "destructive",
              duration: 3000,
            });
            resolve(null);
          } else {
            const imageUrl = URL.createObjectURL(file);
            toast({
              title: "Imagem adicionada",
              description: "A imagem foi inserida com sucesso",
              duration: 2000,
            });
            resolve(imageUrl);
          }
        };
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error handling image upload:', error);
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
    extraPlugins: [uploadAdapterPlugin],
    image: {
      ...config.image,
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageTextAlternative'
      ],
      upload: {
        types: ['jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'],
        handler: handleImageUpload
      }
    },
    clipboard: {
      ...config.clipboard,
      handleImages: true
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
            calculateProgress(data);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          config={editorConfig}
        />
      </div>
      {isFocused && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className={`text-xs ${progress >= 100 ? 'text-red-500' : 'text-gray-500'} text-right`}>
            {Math.min(Math.round(progress), 100)}% do limite
          </p>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;