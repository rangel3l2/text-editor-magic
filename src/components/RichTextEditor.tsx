
import { useState, useEffect } from 'react';
import { uploadAdapterPlugin } from '@/utils/uploadAdapter';
import EditorCore from './editor/EditorCore';
import EditorProgress from './editor/EditorProgress';
import ImageUploadHandler from './editor/ImageUploadHandler';
import ValidationFeedback from './editor/ValidationFeedback';
import { useEditorValidation } from './editor/useEditorValidation';
import { useEditorProgress } from './editor/useEditorProgress';

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

  // Validar conteúdo com debounce
  useEffect(() => {
    if (shouldValidate && contentToValidate) {
      const timeout = setTimeout(() => {
        validateContent(contentToValidate);
        setShouldValidate(false);
        setContentToValidate('');
      }, 2000);
      
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
    
    if (!isOverLimit) {
      onChange(data);
      
      // Agendar validação com debounce
      if (data.trim().length > 20) {
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
    if (value && value.trim().length > 50) {
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
