import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';
import { calculateTextProgress } from '@/utils/textProgress';
import EditorProgress from './editor/EditorProgress';
import ImageUploadHandler from './editor/ImageUploadHandler';

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

  const handleContentChange = (data: string) => {
    const { percentage, actualLines, isOverLimit, isBelowMinimum } = calculateTextProgress(data, maxLines, minLines);
    
    setProgress(percentage);
    setCurrentLines(actualLines);

    if (isBelowMinimum) {
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
    } else if (isOverLimit) {
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

  const { handleImageUpload } = ImageUploadHandler({
    onSuccess: (imageUrl) => {
      // Callback quando a imagem é carregada com sucesso
      console.log('Image uploaded:', imageUrl);
    }
  });

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
              const isOverLimit = handleContentChange(data);
              
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
            handleContentChange(value);
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
        <EditorProgress
          progress={progress}
          currentLines={currentLines}
          maxLines={maxLines}
          minLines={minLines}
        />
      )}
    </div>
  );
};

export default RichTextEditor;