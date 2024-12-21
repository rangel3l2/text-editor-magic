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

  const {
    validationResult,
    isValidating,
    validateContent,
    scheduleValidation,
    currentSection
  } = useEditorValidation(sectionName);

  const {
    progress,
    currentLines,
    handleContentChange
  } = useEditorProgress(maxLines, minLines);

  // Validar conteúdo inicial quando carregado dos cookies
  useEffect(() => {
    if (value && value.trim()) {
      validateContent(value);
    }
  }, []); // Executar apenas uma vez na montagem

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
      scheduleValidation(data);
    } else {
      if (editorInstance) {
        editorInstance.setData(value);
      }
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
        onBlur={() => setIsFocused(false)}
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
        currentSection={currentSection}
      />
    </div>
  );
};

export default RichTextEditor;