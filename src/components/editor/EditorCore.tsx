
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { checkSpelling } from "@/services/spellCheckService";

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
  const [spellingErrors, setSpellingErrors] = useState<any[]>([]);

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
      setSpellingErrors(errors);
      
      if (editorRef.current) {
        const editorContent = editorRef.current.editing.view.getDomRoot();
        
        // Remove marcações anteriores
        const oldMarks = editorContent.querySelectorAll('.spelling-error, .grammar-error');
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
              span.className = error.type === 'spelling' ? 'spelling-error' : 'grammar-error';
              span.setAttribute('data-suggestions', JSON.stringify(error.suggestions));
              span.setAttribute('data-word', searchText);
              span.setAttribute('title', error.message || 'Erro encontrado');
              
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
        background-color: rgba(255, 0, 0, 0.05);
      }
      .grammar-error {
        border-bottom: 2px solid #ffa500;
        cursor: pointer;
        background-color: rgba(255, 165, 0, 0.05);
      }
      .ck-context-menu {
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        padding: 4px 0;
        min-width: 150px;
      }
      .ck-context-menu__item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .ck-context-menu__item:hover {
        background-color: #f0f0f0;
      }
      .ck-context-menu__separator {
        height: 1px;
        background-color: #e0e0e0;
        margin: 4px 0;
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
      }, 1000);
    };

    if (value) {
      debouncedCheck(value);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value]);

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
          
          // Configura o menu de contexto
          editor.editing.view.document.on('click', (evt, data) => {
            const domEvent = data.domEvent;
            const targetElement = domEvent.target as HTMLElement;
            
            if (targetElement.classList.contains('spelling-error') || 
                targetElement.classList.contains('grammar-error')) {
              domEvent.preventDefault();
              
              // Remove menu anterior se existir
              const oldMenu = document.querySelector('.ck-context-menu');
              if (oldMenu) oldMenu.remove();
              
              const word = targetElement.getAttribute('data-word');
              const suggestionsStr = targetElement.getAttribute('data-suggestions');
              if (word && suggestionsStr) {
                const suggestions = JSON.parse(suggestionsStr);
                
                // Cria o menu de sugestões
                const menu = document.createElement('div');
                menu.className = 'ck-context-menu';
                menu.style.position = 'fixed';
                menu.style.left = `${domEvent.clientX}px`;
                menu.style.top = `${domEvent.clientY}px`;
                menu.style.zIndex = '10000';

                // Adiciona as sugestões
                suggestions.forEach((suggestion: string) => {
                  const item = document.createElement('div');
                  item.className = 'ck-context-menu__item';
                  item.textContent = suggestion;
                  item.onclick = () => {
                    const range = editor.model.createRange(
                      editor.model.createPositionFromPath(
                        editor.model.document.getRoot(),
                        [0]
                      )
                    );
                    editor.model.change(writer => {
                      writer.insertText(suggestion, range);
                    });
                    targetElement.remove();
                    menu.remove();
                  };
                  menu.appendChild(item);
                });

                // Adiciona separador
                const separator = document.createElement('div');
                separator.className = 'ck-context-menu__separator';
                menu.appendChild(separator);

                // Adiciona opções de ignorar
                const ignoreItem = document.createElement('div');
                ignoreItem.className = 'ck-context-menu__item';
                ignoreItem.textContent = 'Ignorar';
                ignoreItem.onclick = () => {
                  const text = targetElement.textContent || '';
                  const parent = targetElement.parentNode;
                  if (parent) {
                    parent.replaceChild(document.createTextNode(text), targetElement);
                  }
                  menu.remove();
                };
                menu.appendChild(ignoreItem);

                document.body.appendChild(menu);

                // Ajusta posição se estiver fora da tela
                const rect = menu.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                  menu.style.left = `${window.innerWidth - rect.width - 10}px`;
                }
                if (rect.bottom > window.innerHeight) {
                  menu.style.top = `${window.innerHeight - rect.height - 10}px`;
                }

                // Remove o menu quando clicar fora dele
                document.addEventListener('click', function closeMenu(e) {
                  if (!menu.contains(e.target as Node)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                  }
                });
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
  );
};

export default EditorCore;
