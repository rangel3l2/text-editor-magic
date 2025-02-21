
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { checkSpelling, ignoreMisspelling } from "@/services/spellCheckService";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    word: string;
    suggestions: string[];
  }>({
    show: false,
    x: 0,
    y: 0,
    word: '',
    suggestions: []
  });

  // Função para obter texto puro do HTML
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Função para verificar ortografia
  const checkText = async (html: string) => {
    try {
      const plainText = stripHtml(html);
      const errors = await checkSpelling(plainText);
      
      if (editorRef.current) {
        const editorContent = editorRef.current.editing.view.getDomRoot();
        
        // Remove marcações anteriores
        const oldMarks = editorContent.querySelectorAll('.spelling-error');
        oldMarks.forEach((mark: Element) => {
          const parent = mark.parentNode;
          if (parent) {
            while (mark.firstChild) {
              parent.insertBefore(mark.firstChild, mark);
            }
            parent.removeChild(mark);
          }
        });

        // Adiciona novas marcações
        errors.forEach(error => {
          const searchText = error.word;
          const walker = document.createTreeWalker(
            editorContent,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent || '';
            const position = text.indexOf(searchText);
            
            if (position !== -1) {
              const range = document.createRange();
              range.setStart(node, position);
              range.setEnd(node, position + searchText.length);
              
              const span = document.createElement('span');
              span.className = 'spelling-error';
              span.setAttribute('data-suggestions', JSON.stringify(error.suggestions));
              span.setAttribute('data-word', searchText);
              span.setAttribute('title', error.message);
              
              range.surroundContents(span);
              break;
            }
          }
        });
      }
    } catch (error) {
      console.error('Erro ao verificar ortografia:', error);
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .spelling-error {
        border-bottom: 2px solid #ff0000;
        cursor: pointer;
        background-color: transparent;
      }
      .spelling-error:hover {
        background-color: rgba(255, 0, 0, 0.05);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Configura o debounce para a verificação ortográfica
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedCheck = (text: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkText(text);
      }, 500);
    };

    if (value) {
      debouncedCheck(value);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <>
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
            
            // Configura o menu de contexto
            editor.editing.view.document.on('click', (evt, data) => {
              const domEvent = data.domEvent;
              const targetElement = domEvent.target as HTMLElement;
              
              if (targetElement.classList.contains('spelling-error')) {
                domEvent.preventDefault();
                
                const word = targetElement.getAttribute('data-word');
                const suggestionsStr = targetElement.getAttribute('data-suggestions');
                if (word && suggestionsStr) {
                  try {
                    const suggestions = JSON.parse(suggestionsStr);
                    setContextMenu({
                      show: true,
                      x: domEvent.clientX,
                      y: domEvent.clientY,
                      word,
                      suggestions
                    });
                  } catch (error) {
                    console.error('Erro ao processar sugestões:', error);
                  }
                }
              }
            });

            if (onReady) onReady(editor);
          }}
          onError={onError}
          onFocus={onFocus}
          onBlur={onBlur}
          config={{
            ...config,
            language: 'pt-br',
          }}
        />
      </div>

      <Dialog 
        open={contextMenu.show} 
        onOpenChange={(open) => {
          if (!open) setContextMenu(prev => ({ ...prev, show: false }));
        }}
      >
        <DialogContent 
          className="max-w-xs"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <DialogTitle>Sugestões para "{contextMenu.word}"</DialogTitle>
          <DialogDescription>
            Selecione uma correção ou ignore o erro
          </DialogDescription>
          <div className="flex flex-col gap-2">
            {contextMenu.suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="text-left px-4 py-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  if (editorRef.current) {
                    const elements = document.querySelectorAll(`[data-word="${contextMenu.word}"]`);
                    elements.forEach(element => {
                      if (element.textContent) {
                        element.textContent = suggestion;
                      }
                      element.classList.remove('spelling-error');
                    });
                  }
                  setContextMenu(prev => ({ ...prev, show: false }));
                }}
              >
                {suggestion}
              </button>
            ))}
            <button
              className="text-left px-4 py-2 hover:bg-gray-100 rounded text-gray-600"
              onClick={() => {
                ignoreMisspelling(contextMenu.word);
                const elements = document.querySelectorAll(`[data-word="${contextMenu.word}"]`);
                elements.forEach(element => {
                  element.classList.remove('spelling-error');
                });
                setContextMenu(prev => ({ ...prev, show: false }));
              }}
            >
              Ignorar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditorCore;
