
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

  // Função para verificar ortografia
  const checkText = async (text: string) => {
    try {
      const errors = await checkSpelling(text);
      setSpellingErrors(errors);
      
      // Atualiza as marcações no editor
      if (editorRef.current) {
        const editorContent = editorRef.current.editing.view.getDomRoot();
        
        // Remove marcações anteriores
        const oldMarks = editorContent.querySelectorAll('.spelling-error, .grammar-error');
        oldMarks.forEach((mark: Element) => {
          mark.classList.remove('spelling-error', 'grammar-error');
        });

        // Adiciona novas marcações
        errors.forEach(error => {
          const range = document.createRange();
          const textNodes = [];
          let currentNode = editorContent.firstChild;
          
          // Encontra o nó de texto correto
          while (currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
              textNodes.push(currentNode);
            }
            currentNode = currentNode.nextSibling;
          }

          let currentOffset = 0;
          for (const textNode of textNodes) {
            const textLength = textNode.textContent?.length || 0;
            if (currentOffset <= error.offset && error.offset < currentOffset + textLength) {
              const startOffset = error.offset - currentOffset;
              range.setStart(textNode, startOffset);
              range.setEnd(textNode, startOffset + error.length);
              
              const span = document.createElement('span');
              span.className = error.type === 'spelling' ? 'spelling-error' : 'grammar-error';
              span.setAttribute('data-suggestions', JSON.stringify(error.suggestions));
              span.setAttribute('data-word', error.word);
              
              range.surroundContents(span);
              break;
            }
            currentOffset += textLength;
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
      }
      .grammar-error {
        border-bottom: 2px solid #ffa500;
        cursor: pointer;
      }
      .ck-context-menu__item {
        cursor: pointer;
        padding: 4px 8px;
      }
      .ck-context-menu__item:hover {
        background-color: #f0f0f0;
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
      }, 1000); // Verifica após 1 segundo de inatividade
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
              
              const word = targetElement.getAttribute('data-word');
              const suggestionsStr = targetElement.getAttribute('data-suggestions');
              if (word && suggestionsStr) {
                const suggestions = JSON.parse(suggestionsStr);
                
                // Cria o menu de sugestões
                const menu = document.createElement('div');
                menu.className = 'ck-context-menu';
                menu.style.position = 'absolute';
                menu.style.left = `${domEvent.pageX}px`;
                menu.style.top = `${domEvent.pageY}px`;
                menu.style.backgroundColor = 'white';
                menu.style.border = '1px solid #ccc';
                menu.style.borderRadius = '4px';
                menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                menu.style.zIndex = '1000';

                // Adiciona as sugestões
                suggestions.forEach((suggestion: string) => {
                  const item = document.createElement('div');
                  item.className = 'ck-context-menu__item';
                  item.textContent = suggestion;
                  item.onclick = () => {
                    targetElement.textContent = suggestion;
                    targetElement.classList.remove('spelling-error', 'grammar-error');
                    menu.remove();
                  };
                  menu.appendChild(item);
                });

                // Adiciona opção de ignorar
                const ignoreItem = document.createElement('div');
                ignoreItem.className = 'ck-context-menu__item';
                ignoreItem.textContent = 'Ignorar';
                ignoreItem.onclick = () => {
                  targetElement.classList.remove('spelling-error', 'grammar-error');
                  menu.remove();
                };
                menu.appendChild(ignoreItem);

                document.body.appendChild(menu);

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
