import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';

interface TipTapBannerEditorProps {
  initialContent: string;
  columnLayout?: '2' | '3';
  onSave: (html: string) => void;
  onClose: () => void;
}

const TipTapBannerEditor = ({ 
  initialContent, 
  columnLayout = '2',
  onSave, 
  onClose 
}: TipTapBannerEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; cursor: move;'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none',
        style: `
          width: 90cm;
          min-height: 120cm;
          padding: 2cm;
          background: white;
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          column-count: ${columnLayout === '3' ? '3' : '2'};
          column-gap: 3rem;
        `
      },
    },
  });

  const handleSave = () => {
    if (editor) {
      const html = editor.getHTML();
      onSave(html);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h2 className="text-lg font-semibold">Editar Banner</h2>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <EditorContent 
            editor={editor} 
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default TipTapBannerEditor;
