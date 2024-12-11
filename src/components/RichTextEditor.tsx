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
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB",
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }

      // Create a blob URL for the image
      const imageUrl = URL.createObjectURL(file);
      
      // Show success toast
      toast({
        title: "Imagem adicionada",
        description: "A imagem foi inserida com sucesso",
        duration: 2000,
      });

      return imageUrl;
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