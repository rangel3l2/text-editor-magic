import { useState, useEffect } from 'react';
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';
import EditorCore from './editor/EditorCore';
import EditorProgress from './editor/EditorProgress';
import ImageUploadHandler from './editor/ImageUploadHandler';
import ValidationFeedback from './editor/ValidationFeedback';
import { useEditorValidation } from './editor/useEditorValidation';
import { useEditorProgress } from './editor/useEditorProgress';
import { cleanHtmlTags } from '@/utils/latexProcessor';

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
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [shouldValidate, setShouldValidate] = useState(false);
  const [contentToValidate, setContentToValidate] = useState('');

  const {
    validationResult,
    isValidating,
    errorMessage,
    validateContent,
    scheduleValidation,
    currentSection
  } = useEditorValidation(sectionName);

  const {
    progress,
    currentLines,
    handleContentChange
  } = useEditorProgress(maxLines, minLines);

  // Load cached validation only on mount if there's content
  useEffect(() => {
    const cleaned = cleanHtmlTags(value || '').trim();
    const isTitle = (sectionName || '').toLowerCase().includes('título') || (sectionName || '').toLowerCase().includes('titulo');
    const minLen = isTitle ? 5 : 20;
    console.log(`🔵 RichTextEditor mount for "${sectionName}":`, {
      hasValue: !!value,
      cleanedLength: cleaned.length,
      willValidate: cleaned.length > minLen,
      isTitle,
    });
    
    if (cleaned.length > minLen) {
      validateContent(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Validar conteúdo com debounce (usando Teoria do Andaime - aguarda o aluno terminar)
  useEffect(() => {
    if (shouldValidate && contentToValidate) {
      const timeout = setTimeout(() => {
        validateContent(contentToValidate);
        setShouldValidate(false);
        setContentToValidate('');
      }, 5000); // 5 segundos para garantir que o usuário terminou de digitar
      
      return () => clearTimeout(timeout);
    }
  }, [shouldValidate, contentToValidate, validateContent]);

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

  const handleEditorChange = (data: string) => {
    const isOverLimit = handleContentChange(data);
    const isTitle = (sectionName || '').toLowerCase().includes('título') || (sectionName || '').toLowerCase().includes('titulo');
    const minLen = isTitle ? 5 : 20;
    
    if (!isOverLimit) {
      onChange(data);
      
      // Agendar validação com debounce
      if (data.trim().length > minLen) {
        setContentToValidate(data);
        setShouldValidate(true);
      }
    } else {
      if (editorInstance) {
        editorInstance.setData(value);
      }
    }
  };

  // Validar quando o usuário sai do campo (blur)
  const handleBlur = () => {
    setIsFocused(false);
    const isTitle = (sectionName || '').toLowerCase().includes('título') || (sectionName || '').toLowerCase().includes('titulo');
    const minLen = isTitle ? 5 : 50;
    if (value && value.trim().length > minLen) {
      validateContent(value);
    }
  };

  return (
    <div className="space-y-4">
      <EditorCore
        value={value}
        onChange={handleEditorChange}
        onReady={(editor) => {
          setEditorInstance(editor);
          handleContentChange(value);
        }}
        onError={(error) => {
          console.error('CKEditor error:', error);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        config={editorConfig}
      />
      
      {isFocused && (
        <EditorProgress
          progress={progress}
          currentLines={currentLines}
          maxLines={maxLines}
          minLines={minLines}
        />
      )}

      <ValidationFeedback 
        validationResult={validationResult}
        isValidating={isValidating}
        errorMessage={errorMessage}
        currentSection={currentSection}
      />
    </div>
  );
};

export default RichTextEditor;
