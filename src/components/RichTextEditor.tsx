import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  config?: any;
  placeholder?: string;
  isObjectives?: boolean;
}

const OBJECTIVES_MAX_LENGTH = 200;

const RichTextEditor = ({ 
  value, 
  onChange, 
  maxLines = 10, 
  config = {}, 
  placeholder,
  isObjectives = false
}: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const editorRef = useRef<any>(null);

  const calculateProgress = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '');
    const chars = plainText.length;
    
    let percentage;
    if (isObjectives) {
      percentage = Math.min((chars / OBJECTIVES_MAX_LENGTH) * 100, 100);
    } else {
      const lines = plainText.split('\n').length;
      const avgCharsPerLine = 80;
      const estimatedLines = Math.ceil(chars / avgCharsPerLine);
      const actualLines = Math.max(lines, estimatedLines);
      percentage = Math.min((actualLines / maxLines) * 100, 100);
    }
    
    setProgress(percentage);

    if (percentage >= 90 && percentage < 100) {
      toast({
        title: "Atenção",
        description: isObjectives 
          ? "Você está próximo do limite de caracteres para os objetivos"
          : "Você está próximo do limite de texto para esta seção",
        duration: 3000,
      });
    } else if (percentage >= 100) {
      toast({
        title: "Limite atingido",
        description: isObjectives
          ? "Você atingiu o limite de caracteres para os objetivos"
          : "Você atingiu o limite de texto para esta seção",
        variant: "destructive",
        duration: 3000,
      });
    }

    return percentage >= 100;
  };

  const handleImageUpload = async (file: File) => {
    try {
      const maxSizeMB = 2;
      const maxWidthPx = 800;
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `A imagem deve ter no máximo ${maxSizeMB}MB`,
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }

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
    placeholder: placeholder || (isObjectives 
      ? `Digite aqui (máximo ${OBJECTIVES_MAX_LENGTH} caracteres)...`
      : `Digite aqui (máximo ${maxLines} linhas)...`),
    extraPlugins: [uploadAdapterPlugin],
    image: {
      ...config.image,
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
          ref={editorRef}
          editor={ClassicEditor}
          data={value}
          onChange={(_event, editor) => {
            try {
              const data = editor.getData();
              const isOverLimit = calculateProgress(data);
              
              if (!isOverLimit) {
                onChange(data);
              } else {
                editor.setData(value);
                toast({
                  title: "Limite excedido",
                  description: isObjectives
                    ? "Não é possível adicionar mais caracteres nos objetivos"
                    : "Não é possível adicionar mais conteúdo nesta seção",
                  variant: "destructive",
                  duration: 3000,
                });
              }
            } catch (error) {
              console.error('Error in editor onChange:', error);
              toast({
                title: "Erro no editor",
                description: "Ocorreu um erro ao processar as alterações. Tente novamente.",
                variant: "destructive",
                duration: 3000,
              });
            }
          }}
          onReady={(editor) => {
            editorRef.current = editor;
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          config={editorConfig}
          onError={(error) => {
            console.error('CKEditor error:', error);
            toast({
              title: "Erro no editor",
              description: "Ocorreu um erro no editor. Tente novamente.",
              variant: "destructive",
              duration: 3000,
            });
          }}
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