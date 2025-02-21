
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

  // Configuração da verificação ortográfica
  const editorConfig = {
    ...config,
    language: {
      ui: 'pt-br',
      content: 'pt-br'
    },
    spellChecker: {
      languageCode: 'pt-br',
      suggestionMenuItems: ['suggest', 'accept', 'ignore', 'ignoreAll'],
      checkUrl: '/api/spellcheck',  // Endpoint para verificação ortográfica
      suggestionsLimit: 5,
      minCharacters: 3,
      spellcheckWhileTyping: true
    }
  };

  // Adiciona estilos CSS para palavras com erro
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .ck-content .spelling-error {
        border-bottom: 2px solid #ff0000;
        cursor: pointer;
      }
      .ck-content .grammar-error {
        border-bottom: 2px solid #ffa500;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
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
          
          // Configuração do menu de sugestões
          editor.plugins.get('ContextMenu').addItems([
            {
              name: 'spellCheckSuggestions',
              label: 'Sugestões',
              icon: 'spell-check',
              items: []
            }
          ]);

          // Manipulador de evento para verificação ortográfica
          editor.editing.view.document.on('click', (evt, data) => {
            const element = data.target;
            if (element.hasClass('spelling-error') || element.hasClass('grammar-error')) {
              const word = element.getCustomProperty('word');
              // Aqui você chamaria sua API de verificação ortográfica
              // para obter sugestões para a palavra
              console.log('Palavra com erro:', word);
            }
          });

          if (onReady) onReady(editor);
        }}
        onError={onError}
        onFocus={onFocus}
        onBlur={onBlur}
        config={editorConfig}
      />
    </div>
  );
};

export default EditorCore;
