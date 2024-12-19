import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';
import { calculateTextProgress } from '@/utils/textProgress';
import EditorProgress from './editor/EditorProgress';
import ImageUploadHandler from './editor/ImageUploadHandler';
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  minLines?: number;
  config?: any;
  placeholder?: string;
  sectionName?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  maxLines = 10,
  minLines = 0, 
  config = {}, 
  placeholder,
  sectionName = ''
}: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLines, setCurrentLines] = useState(0);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const validationTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (editorInstance) {
        editorInstance.destroy()
          .catch((error: any) => console.error('Editor cleanup error:', error));
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [editorInstance]);

  const validateContent = async (content: string) => {
    if (!content.trim() || !sectionName) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-content', {
        body: { content, section: sectionName }
      });

      if (error) throw error;

      setValidationResult(data);

      if (!data.isValid) {
        toast({
          title: "Problemas encontrados no conteúdo",
          description: "Verifique as sugestões de melhoria abaixo do editor.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Conteúdo validado com sucesso",
          description: "O texto está adequado para esta seção.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error validating content:', error);
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o conteúdo. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleContentChange = (data: string) => {
    const { percentage, actualLines, isOverLimit } = calculateTextProgress(data, maxLines, minLines);
    
    setProgress(percentage);
    setCurrentLines(actualLines);

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

    // Schedule content validation after user stops typing
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    validationTimeoutRef.current = setTimeout(() => {
      validateContent(data);
    }, 2000);

    return false;
  };

  const { handleImageUpload } = ImageUploadHandler({
    onSuccess: (imageUrl) => {
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
    <div className="space-y-4">
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

      {isValidating && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validando conteúdo...</AlertTitle>
          <AlertDescription>
            Aguarde enquanto analisamos o texto.
          </AlertDescription>
        </Alert>
      )}

      {validationResult && !isValidating && (
        <div className="space-y-4">
          <Alert variant={validationResult.isValid ? "default" : "destructive"}>
            {validationResult.isValid ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {validationResult.isValid ? "Conteúdo adequado" : "Atenção: problemas encontrados"}
            </AlertTitle>
            <AlertDescription>
              {validationResult.overallFeedback}
            </AlertDescription>
          </Alert>

          {!validationResult.isValid && (
            <div className="space-y-2">
              {validationResult.grammarErrors.length > 0 && (
                <div>
                  <h4 className="font-semibold">Erros gramaticais:</h4>
                  <ul className="list-disc pl-5">
                    {validationResult.grammarErrors.map((error: string, index: number) => (
                      <li key={`grammar-${index}`} className="text-sm text-gray-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.coherenceIssues.length > 0 && (
                <div>
                  <h4 className="font-semibold">Problemas de coesão e coerência:</h4>
                  <ul className="list-disc pl-5">
                    {validationResult.coherenceIssues.map((issue: string, index: number) => (
                      <li key={`coherence-${index}`} className="text-sm text-gray-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.sectionSpecificIssues.length > 0 && (
                <div>
                  <h4 className="font-semibold">Problemas específicos da seção:</h4>
                  <ul className="list-disc pl-5">
                    {validationResult.sectionSpecificIssues.map((issue: string, index: number) => (
                      <li key={`section-${index}`} className="text-sm text-gray-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold">Sugestões de melhoria:</h4>
                  <ul className="list-disc pl-5">
                    {validationResult.suggestions.map((suggestion: string, index: number) => (
                      <li key={`suggestion-${index}`} className="text-sm text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;