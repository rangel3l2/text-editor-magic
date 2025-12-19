import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useRef, useEffect } from 'react';
import '@ckeditor/ckeditor5-build-classic/build/translations/pt-br';
import editorConfig from '@/config/editorConfig';

interface EditorCoreProps {
  value: string;
  onChange: (data: string) => void;
  onReady?: (editor: any) => void;
  onError?: (error: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  config?: any;
}

const EditorCore = ({
  value,
  onChange,
  onReady,
  onError,
  onFocus,
  onBlur,
  config = {}
}: EditorCoreProps) => {
  const editorRef = useRef<any>(null);
  const isInternalChangeRef = useRef(false);
  const lastExternalValueRef = useRef(value);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorRef.current) {
        const currentData = editorRef.current.getData();
        if (currentData !== value && currentData.trim().length > 0) {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [value]);

  // Sincronizar valor externo com o editor apenas quando não for mudança interna
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      const currentEditorData = editorRef.current.getData();
      // Só atualizar se o valor realmente mudou de uma fonte externa
      if (value !== currentEditorData && value !== lastExternalValueRef.current) {
        lastExternalValueRef.current = value;
        editorRef.current.setData(value);
      }
    }
    isInternalChangeRef.current = false;
  }, [value]);

  return (
    <div className="editor-core">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          language: 'pt-br',
          removePlugins: ['MediaEmbed'],
          toolbar: editorConfig.toolbar,
          enterMode: 2, // ENTER_P - cria <p> ao pressionar Enter
          shiftEnterMode: 1, // ENTER_BR - cria <br> ao pressionar Shift+Enter
          autoParagraph: true, // Envolve texto automaticamente em <p>
          ...config
        }}
        onReady={(editor) => {
          editorRef.current = editor;
          lastExternalValueRef.current = value;
          if (onReady) onReady(editor);

          // Adicionar classes personalizadas ao editor
          const editorElement = editor.ui.view.editable.element;
          if (editorElement) {
            editorElement.classList.add('prose', 'max-w-none', 'focus:outline-none', 'min-h-[200px]');
            // Forçar LTR para evitar texto "invertido" (RTL) em alguns navegadores/configurações
            editorElement.setAttribute('dir', 'ltr');
            (editorElement.style as any).direction = 'ltr';
            (editorElement.style as any).unicodeBidi = 'plaintext';
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          // Marcar como mudança interna para evitar loop de atualização
          isInternalChangeRef.current = true;
          lastExternalValueRef.current = data;
          onChange(data);
        }}
        onBlur={(event, editor) => {
          if (onBlur) onBlur();
        }}
        onFocus={(event, editor) => {
          if (onFocus) onFocus();
        }}
        onError={(error, { willEditorRestart }) => {
          if (onError) onError(error);
          
          if (willEditorRestart) {
            editorRef.current = null;
          }
        }}
      />
    </div>
  );
};

export default EditorCore;
