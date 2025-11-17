import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Button } from '@/components/ui/button';
import { X, Save, Bold, Italic, List, AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useEffect, useRef, useState } from 'react';

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
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
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
        'data-column-layout': columnLayout,
      },
      handleDOMEvents: {
        mousedown: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Selecionar imagem ao clicar
          if (target.tagName === 'IMG') {
            event.preventDefault();
            event.stopPropagation();
            
            // Remove seleção anterior
            document.querySelectorAll('.tiptap-image-selected').forEach(img => {
              img.classList.remove('tiptap-image-selected');
            });
            
            // Adiciona seleção na imagem clicada
            target.classList.add('tiptap-image-selected');
            setSelectedImage(target as HTMLImageElement);
            return true;
          } else {
            // Remove seleção se clicar fora
            document.querySelectorAll('.tiptap-image-selected').forEach(img => {
              img.classList.remove('tiptap-image-selected');
            });
            setSelectedImage(null);
          }
          return false;
        },
        dblclick: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Duplo clique em imagem para editar tamanho
          if (target.tagName === 'IMG') {
            event.preventDefault();
            const currentWidth = target.style.width || '100%';
            const newWidth = prompt('Digite a largura da imagem (ex: 50%, 300px):', currentWidth);
            if (newWidth) {
              target.style.width = newWidth;
              target.style.height = 'auto';
            }
            return true;
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

  // Adicionar controles de redimensionamento nas imagens
  useEffect(() => {
    if (!editorRef.current) return;

    const handleImageResize = (e: MouseEvent) => {
      if (!selectedImage || !resizing) return;
      
      const rect = selectedImage.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      
      if (newWidth > 50) {
        selectedImage.style.width = `${newWidth}px`;
        selectedImage.style.height = 'auto';
      }
    };

    const handleMouseUp = () => {
      setResizing(false);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleImageResize);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleImageResize);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [selectedImage, resizing]);

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
              ref={editorRef}
              className="bg-white shadow-2xl mx-auto banner-content"
              style={{
                width: '90cm',
                maxWidth: '100%',
                minHeight: '120cm',
                padding: '2cm',
                transform: 'scale(0.4)',
                transformOrigin: 'top center',
              }}
            >
              <EditorContent 
                editor={editor}
                className="banner-tiptap-content"
              />
            </div>
          </div>
        </div>
        
        {/* Dica de uso */}
        {selectedImage && (
          <div className="shrink-0 p-2 bg-muted/50 border-t text-sm text-center text-muted-foreground">
            💡 Duplo clique na imagem para alterar o tamanho
          </div>
        )}
      </div>
    </div>
  );
};

export default TipTapBannerEditor;
