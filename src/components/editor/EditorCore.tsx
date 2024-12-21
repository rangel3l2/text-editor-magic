import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface EditorCoreProps {
  value: string;
  onChange: (value: string) => void;
  onReady?: (editor: any) => void;
  config?: any;
  onError?: (error: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const EditorCore = ({
  value,
  onChange,
  onReady,
  config,
  onError,
  onFocus,
  onBlur
}: EditorCoreProps) => {
  const editorRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
          .catch((error: any) => console.error('Editor cleanup error:', error));
      }
    };
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg">
      <CKEditor
        ref={editorRef}
        editor={ClassicEditor}
        data={value}
        onChange={(_event, editor) => {
          try {
            const data = editor.getData();
            onChange(data);
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
          if (onReady) onReady(editor);
        }}
        onError={onError}
        onFocus={onFocus}
        onBlur={onBlur}
        config={config}
      />
    </div>
  );
};

export default EditorCore;