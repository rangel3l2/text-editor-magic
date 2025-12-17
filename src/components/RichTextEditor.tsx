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
  showValidationFeedback = true
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

      {/* Botão para validar manualmente com design atrativo */}
      {shouldShowButton && isValidationVisible && !isValidated && value?.trim() && (
        <Button
          onClick={handleManualValidation}
          variant="outline"
          size="lg"
          className="w-full gap-2 sm:gap-3 py-4 sm:py-6 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 group relative overflow-hidden"
          disabled={isValidating}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="relative flex items-center gap-2 sm:gap-3 pointer-events-none">
            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold text-xs sm:text-sm">
                {isValidating ? 'Orientando...' : 'Precisa de orientação?'}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Clique para receber feedback sobre este campo
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
         />
       )}
     </div>
   );
 };
 
 export default RichTextEditor;
