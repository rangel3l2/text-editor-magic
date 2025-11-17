import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import { X, Save, Bold, Italic, List, AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useEffect } from 'react';

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
      TextStyle,
      Color,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'tiptap-image',
          style: 'max-width: 100%; height: auto; cursor: pointer;'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content focus:outline-none',
      },
      handleDOMEvents: {
        mousedown: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'IMG') {
            target.classList.add('tiptap-image-selected');
            target.setAttribute('contenteditable', 'false');
            return false;
          }
          return false;
        }
      }
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  const handleSave = () => {
    if (editor) {
      const html = editor.getHTML();
      onSave(html);
    }
  };

  if (!editor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-background rounded-lg shadow-xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
        {/* Header com título e ações */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">Editar Banner Científico</h2>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar de formatação */}
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50 shrink-0">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Toggle>
          <div className="w-px h-8 bg-border mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Toggle>
          <div className="w-px h-8 bg-border mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Toggle>
        </div>
        
        {/* Área de edição com scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-2 sm:p-4 md:p-8">
          <div className="max-w-full mx-auto">
            <div 
              className="bg-white shadow-2xl mx-auto banner-content"
              style={{
                width: '90cm',
                maxWidth: '100%',
                minHeight: '120cm',
                padding: '2cm',
                transform: 'scale(0.4)',
                transformOrigin: 'top center',
                fontFamily: "'Times New Roman', serif",
                fontSize: '12pt',
                lineHeight: '1.5',
              }}
            >
              <EditorContent 
                editor={editor}
                className="tiptap-columns"
                style={{
                  columnCount: columnLayout === '3' ? 3 : 2,
                  columnGap: '3rem',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipTapBannerEditor;
