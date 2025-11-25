import { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Progress } from "@/components/ui/progress";
import editorConfig from '@/config/editorConfig';

interface ProgressEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines: number;
  config?: any;
  placeholder?: string;
}

const ProgressEditor = ({ value, onChange, maxLines, config, placeholder }: ProgressEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [progress, setProgress] = useState(0);

  const calculateProgress = (text: string) => {
    const lines = text.split('\n').length;
    const chars = text.length;
    const avgCharsPerLine = 80; // Média aproximada de caracteres por linha
    const estimatedLines = Math.ceil(chars / avgCharsPerLine);
    const actualLines = Math.max(lines, estimatedLines);
    const percentage = Math.min((actualLines / maxLines) * 100, 100);
    setProgress(percentage);
  };

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 rounded-lg">
        <CKEditor
          editor={ClassicEditor}
          data={value}
          config={{
            language: 'pt-br',
            removePlugins: ['MediaEmbed'],
            toolbar: editorConfig.toolbar,
            placeholder: placeholder || `Digite aqui (máximo ${maxLines} linhas)...`,
            ...config
          }}
          onChange={(_event, editor) => {
            const data = editor.getData();
            onChange(data);
            calculateProgress(data.replace(/<[^>]*>/g, ''));
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      {isFocused && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 text-right">{Math.min(Math.round(progress), 100)}% do limite</p>
        </div>
      )}
    </div>
  );
};

export default ProgressEditor;