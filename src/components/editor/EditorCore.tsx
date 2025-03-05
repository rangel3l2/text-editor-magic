import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useRef, useEffect, useState } from 'react';
import '@ckeditor/ckeditor5-build-classic/build/translations/pt-br';

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
  const [localBackup, setLocalBackup] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState<number>(Date.now());
  
  // Generate a unique key for the current editor instance
  const generateEditorKey = () => {
    // Create a key based on the component's context
    const pathname = window.location.pathname;
    const urlParts = pathname.split('/');
    const contentType = urlParts[1]; // e.g., 'banner'
    const contentId = urlParts[2]; // e.g., the work ID
    
    // If we're in editor mode with an ID, create a specific key
    if (contentType && contentId) {
      return `editor_${contentType}_${contentId}`;
    }
    
    // Otherwise create a generic key
    return 'editor_draft';
  };
  
  const editorLocalStorageKey = generateEditorKey();

  // Try to restore from local storage when component mounts or when value is empty
  useEffect(() => {
    if (!value || value.trim() === '') {
      const savedContent = localStorage.getItem(editorLocalStorageKey);
      if (savedContent && savedContent.trim() !== '') {
        setLocalBackup(savedContent);
        onChange(savedContent);
      }
    }
  }, [value, onChange, editorLocalStorageKey]);

  // Save to local storage whenever content changes
  useEffect(() => {
    if (value && value.trim() !== '') {
      localStorage.setItem(editorLocalStorageKey, value);
    }
  }, [value, editorLocalStorageKey]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorRef.current) {
        const currentData = editorRef.current.getData();
        if (currentData !== value && currentData.trim().length > 0) {
          // Save to local storage before unloading
          localStorage.setItem(editorLocalStorageKey, currentData);
          
          // Only prompt if the change is significant
          if (currentData.length - value.length > 10 || value.length - currentData.length > 10) {
            e.preventDefault();
            e.returnValue = '';
            return '';
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [value, editorLocalStorageKey]);

  // If editor crashes, try to recover and recreate it
  const handleEditorError = (error: any) => {
    console.error('Editor error:', error);
    
    // Save current content to local storage
    if (editorRef.current) {
      try {
        const currentData = editorRef.current.getData();
        if (currentData.trim().length > 0) {
          localStorage.setItem(editorLocalStorageKey, currentData);
        }
      } catch (e) {
        console.error('Failed to save editor content before recovery:', e);
      }
    }
    
    // Recreate the editor
    setEditorKey(Date.now());
    
    if (onError) onError(error);
  };

  return (
    <div className="editor-core">
      <CKEditor
        key={editorKey}
        editor={ClassicEditor}
        data={value}
        config={{
          language: 'pt-br',
          removePlugins: ['MediaEmbed'],
          autosave: {
            save: (editor: any) => {
              const data = editor.getData();
              localStorage.setItem(editorLocalStorageKey, data);
            },
            waitingTime: 1000
          },
          ...config
        }}
        onReady={(editor) => {
          editorRef.current = editor;
          if (onReady) onReady(editor);
          
          // Adicionar classes personalizadas ao editor
          const editorElement = editor.ui.view.editable.element;
          if (editorElement) {
            editorElement.classList.add('prose', 'max-w-none', 'focus:outline-none', 'min-h-[200px]');
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
          
          // Backup to local storage as we edit
          localStorage.setItem(editorLocalStorageKey, data);
        }}
        onBlur={(event, editor) => {
          // Save on blur
          const data = editor.getData();
          localStorage.setItem(editorLocalStorageKey, data);
          if (onBlur) onBlur();
        }}
        onFocus={(event, editor) => {
          if (onFocus) onFocus();
        }}
        onError={(error, { willEditorRestart }) => {
          handleEditorError(error);
          
          if (willEditorRestart) {
            editorRef.current = null;
          }
        }}
      />
      
      {localBackup && !value && (
        <div className="text-sm text-amber-600 mt-1">
          Conteúdo restaurado do backup local. Se não estiver vendo o conteúdo esperado, tente recarregar a página.
        </div>
      )}
    </div>
  );
};

export default EditorCore;
