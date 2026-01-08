import { useState, useEffect } from 'react';
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';
import EditorCore from './editor/EditorCore';
import EditorProgress from './editor/EditorProgress';
import ImageUploadHandler from './editor/ImageUploadHandler';
import ValidationFeedback from './editor/ValidationFeedback';
import { useEditorValidation } from './editor/useEditorValidation';
import { useEditorProgress } from './editor/useEditorProgress';
import { cleanHtmlTags } from '@/utils/latexProcessor';
import { useValidationContext } from '@/contexts/ValidationContext';
import { useManualValidationContext } from '@/contexts/ManualValidationContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { FileImage, BarChart3, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  minLines?: number;
  config?: any;
  placeholder?: string;
  sectionName?: string;
  onCustomImageUpload?: (file: File) => void;
  onEditorReady?: (editor: any) => void;
  onRequestAttachmentInsertion?: (payload: { type: 'figura' | 'grafico' | 'tabela'; selectionPath: number[]; placeholderId?: string }) => void;
  showValidationFeedback?: boolean;
  onCustomBlur?: () => void;
  onInsertContent?: (callback: (html: string) => void) => void;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  maxLines = 10,
  minLines = 0, 
  config = {}, 
  placeholder,
  sectionName = '',
  onCustomImageUpload,
  onEditorReady,
  onRequestAttachmentInsertion,
  showValidationFeedback = true,
  onCustomBlur,
  onInsertContent
}: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [shouldValidate, setShouldValidate] = useState(false);
  const [contentToValidate, setContentToValidate] = useState('');
  const { isValidationVisible } = useValidationContext();
  const manualValidation = useManualValidationContext();

  const {
    validationResult,
    isValidating,
    errorMessage,
    validateContent,
    scheduleValidation,
    currentSection,
    retryValidation
  } = useEditorValidation(sectionName, isValidationVisible);

  const {
    progress,
    currentLines,
    handleContentChange
  } = useEditorProgress(maxLines, minLines);

  const isValidated = sectionName ? manualValidation.isValidated(sectionName) : false;
  const shouldShowButton = sectionName ? manualValidation.shouldShowValidationButton(sectionName) : false;

  // Função para validar manualmente
  const handleManualValidation = async () => {
    if (value && sectionName) {
      await validateContent(value);
      manualValidation.markFieldValidated(sectionName);
    }
  };

  // NÃO validar automaticamente no mount - apenas validação manual

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
        handler: onCustomImageUpload || handleImageUpload
      }
    },
    customImageUploadHandler: onCustomImageUpload,
    clipboard: {
      ...config.clipboard,
      handleImages: true
    }
  };

  const handleEditorChange = (data: string) => {
    handleContentChange(data);
    onChange(data);
    // Não agenda mais validação automática durante a digitação
  };

  // Validar automaticamente apenas o primeiro campo quando o usuário sai dele
  const handleBlur = () => {
    setIsFocused(false);
    
    // Chamar callback customizado de blur (ex: para conversão de caixa alta)
    if (onCustomBlur) {
      onCustomBlur();
    }
    
    if (!isValidationVisible || !sectionName) return;
    
    // Se é o primeiro campo e deve auto-validar
    if (manualValidation.shouldAutoValidate(sectionName)) {
      const isTitle = (sectionName || '').toLowerCase().includes('título') || (sectionName || '').toLowerCase().includes('titulo');
      const minLen = isTitle ? 5 : 50;
      if (value && value.trim().length > minLen) {
        validateContent(value);
        manualValidation.markFieldValidated(sectionName);
      }
    }
  };

  // Marcar campo como focado
  const handleFocus = () => {
    setIsFocused(true);
    if (sectionName) {
      manualValidation.markFieldFocused(sectionName);
    }
  };

  // Expor função para inserir conteúdo HTML no editor
  useEffect(() => {
    if (onInsertContent && editorInstance) {
      onInsertContent((html: string) => {
        if (!html || typeof html !== "string") return;

        try {
          const viewFragment = editorInstance.data.processor.toView(html);
          const modelFragment = editorInstance.data.toModel(viewFragment);

          editorInstance.model.change((writer: any) => {
            const selection = editorInstance.model.document.selection;
            const position = selection?.getFirstPosition?.();
            const root = editorInstance.model.document.getRoot();

            // Inserir na posição atual do cursor; se não houver, inserir no final
            const insertPosition = position?.root ? position : writer.createPositionAt(root, "end");
            editorInstance.model.insertContent(modelFragment, insertPosition);
          });

          // Atualizar o valor
          const newValue = editorInstance.getData();
          onChange(newValue);
        } catch (error) {
          console.error("Erro ao inserir conteúdo:", error);
          // Fallback: adicionar ao final do value
          const safeHtml = typeof html === "string" ? html : "";
          const newValue = (value || "") + safeHtml;
          onChange(newValue);
        }
      });
    }
  }, [onInsertContent, editorInstance, onChange, value]);


  return (
    <div className="editor-container relative space-y-2">
      <ContextMenu>
        <ContextMenuTrigger className="w-full">
          <EditorCore
        value={value}
        onChange={handleEditorChange}
        onReady={(editor) => {
          setEditorInstance(editor);
          handleContentChange(value);
          
          if (onEditorReady) {
            onEditorReady(editor);
          }
        }}
        onError={(error) => {
          console.error('CKEditor error:', error);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        config={editorConfig}
          />
        </ContextMenuTrigger>

        {onRequestAttachmentInsertion && (
          <ContextMenuContent className="w-56">
            <ContextMenuLabel>Inserir Anexo</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => {
              if (!onRequestAttachmentInsertion || !editorInstance) {
                console.log('🚫 Inserção cancelada:', { hasCallback: !!onRequestAttachmentInsertion, hasEditor: !!editorInstance });
                return;
              }
              const placeholderId = `ph_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
              
              // Salvar a posição antes de qualquer operação
              const selection = editorInstance.model.document.selection;
              const position = selection.getFirstPosition();
              const path = position && (position as any).path ? (position as any).path : [];
              
              try {
                editorInstance.model.change((writer: any) => {
                  const tokenText = `[[placeholder:${placeholderId}]] `;
                  const root = editorInstance.model.document.getRoot();
                  
                  // Criar uma posição válida no final se a posição atual for inválida
                  let insertPosition = position;
                  if (!insertPosition || !insertPosition.root) {
                    insertPosition = writer.createPositionAt(root, 'end');
                  }
                  
                  writer.insertText(tokenText, insertPosition);
                });
                console.log('🖼️ Solicitando inserção de imagem. Path do cursor:', path, 'Seção:', sectionName, 'Placeholder:', placeholderId);
                onRequestAttachmentInsertion({ type: 'figura', selectionPath: path, placeholderId });
              } catch (error) {
                console.error('Erro ao inserir placeholder:', error);
              }
            }}>
              <FileImage className="mr-2 h-4 w-4" />
              <span>Inserir Imagem</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              if (!onRequestAttachmentInsertion || !editorInstance) {
                console.log('🚫 Inserção cancelada:', { hasCallback: !!onRequestAttachmentInsertion, hasEditor: !!editorInstance });
                return;
              }
              const placeholderId = `ph_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
              
              const selection = editorInstance.model.document.selection;
              const position = selection.getFirstPosition();
              const path = position && (position as any).path ? (position as any).path : [];
              
              try {
                editorInstance.model.change((writer: any) => {
                  const tokenText = `[[placeholder:${placeholderId}]] `;
                  const root = editorInstance.model.document.getRoot();
                  
                  let insertPosition = position;
                  if (!insertPosition || !insertPosition.root) {
                    insertPosition = writer.createPositionAt(root, 'end');
                  }
                  
                  writer.insertText(tokenText, insertPosition);
                });
                console.log('📊 Solicitando inserção de gráfico. Path do cursor:', path, 'Seção:', sectionName, 'Placeholder:', placeholderId);
                onRequestAttachmentInsertion({ type: 'grafico', selectionPath: path, placeholderId });
              } catch (error) {
                console.error('Erro ao inserir placeholder:', error);
              }
            }}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Inserir Gráfico</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              if (!onRequestAttachmentInsertion || !editorInstance) {
                console.log('🚫 Inserção cancelada:', { hasCallback: !!onRequestAttachmentInsertion, hasEditor: !!editorInstance });
                return;
              }
              const placeholderId = `ph_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
              
              const selection = editorInstance.model.document.selection;
              const position = selection.getFirstPosition();
              const path = position && (position as any).path ? (position as any).path : [];
              
              try {
                editorInstance.model.change((writer: any) => {
                  const tokenText = `[[placeholder:${placeholderId}]] `;
                  const root = editorInstance.model.document.getRoot();
                  
                  let insertPosition = position;
                  if (!insertPosition || !insertPosition.root) {
                    insertPosition = writer.createPositionAt(root, 'end');
                  }
                  
                  writer.insertText(tokenText, insertPosition);
                });
                console.log('📋 Solicitando inserção de tabela. Path do cursor:', path, 'Seção:', sectionName, 'Placeholder:', placeholderId);
                onRequestAttachmentInsertion({ type: 'tabela', selectionPath: path, placeholderId });
              } catch (error) {
                console.error('Erro ao inserir placeholder:', error);
              }
            }}>
              <Table2 className="mr-2 h-4 w-4" />
              <span>Inserir Tabela</span>
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
      
      {isFocused && (
        <EditorProgress
          progress={progress}
          currentLines={currentLines}
          maxLines={maxLines}
          minLines={minLines}
        />
      )}

      {/* Indicador de campo validado */}
      {isValidated && isValidationVisible && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>Campo validado</span>
        </div>
      )}

      {/* Botão para validar manualmente com design atrativo e intuitivo */}
      {shouldShowButton && isValidationVisible && !isValidated && value?.trim() && (
        <Button
          onClick={handleManualValidation}
          variant="default"
          size="lg"
          className="w-full gap-2 sm:gap-3 py-5 sm:py-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-pulse"
          disabled={isValidating}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="relative flex items-center gap-2 sm:gap-3 pointer-events-none">
            <div className="p-1.5 sm:p-2 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-sm sm:text-base">
                {isValidating ? '⏳ Analisando...' : '✨ Clique aqui para orientação'}
              </span>
              <span className="text-[11px] sm:text-xs text-primary-foreground/80">
                Receba feedback personalizado da IA sobre seu texto
              </span>
            </div>
          </div>
        </Button>
      )}

      {showValidationFeedback && isValidationVisible && (
         <ValidationFeedback 
           validationResult={validationResult}
           isValidating={isValidating}
           errorMessage={errorMessage}
           currentSection={currentSection}
           onRetry={() => retryValidation(value)}
           onRevalidate={() => validateContent(value)}
         />
       )}
     </div>
   );
 };
 
 export default RichTextEditor;
