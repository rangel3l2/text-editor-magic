import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Progress } from "@/components/ui/progress";
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  minLines?: number;
  config?: any;
  placeholder?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  maxLines = 10,
  minLines = 0, 
  config = {}, 
  placeholder
}: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLines, setCurrentLines] = useState(0);
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (editorInstance) {
        editorInstance.destroy()
          .catch((error: any) => console.error('Editor cleanup error:', error));
      }
    };
  }, [editorInstance]);

  const calculateProgress = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '');
    const lines = plainText.split('\n').length;
    const chars = plainText.length;
    const avgCharsPerLine = 80;
    const estimatedLines = Math.ceil(chars / avgCharsPerLine);
    const actualLines = Math.max(lines, estimatedLines);
    setCurrentLines(actualLines);
    
    let percentage = Math.min((actualLines / maxLines) * 100, 100);
    setProgress(percentage);

    if (actualLines < minLines) {
      toast({
        title: "Conteúdo insuficiente",
        description: `É necessário pelo menos ${minLines} linhas nesta seção`,
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }

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
      return true;
    }

    return false;
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
    placeholder: placeholder || `Digite aqui (${minLines}-${maxLines} linhas)...`,
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
                  description: "Não é possível adicionar mais conteúdo nesta seção",
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
            setEditorInstance(editor);
          }}
          onError={(error) => {
            console.error('CKEditor error:', error);
            toast({
              title: "Erro no editor",
              description: "Ocorreu um erro no editor. Tente novamente.",
              variant: "destructive",
              duration: 3000,
            });
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          config={editorConfig}
        />
      </div>
      {isFocused && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center text-xs">
            <span className={`${currentLines < minLines ? 'text-red-500' : 'text-gray-500'}`}>
              Mínimo: {minLines} linhas
            </span>
            <span className={`${progress >= 100 ? 'text-red-500' : 'text-gray-500'}`}>
              {currentLines} de {maxLines} linhas ({Math.min(Math.round(progress), 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;