import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

const TextEditor = () => {
  const [content, setContent] = useState('');
  const { toast } = useToast();
  
  const handleChange = (_event: any, editor: any) => {
    const data = editor.getData();
    setContent(data);
    
    // Auto-save functionality
    localStorage.setItem('editorContent', data);
    toast({
      title: "Content saved",
      description: "Your content has been automatically saved",
      duration: 2000,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border border-gray-200">
          <CKEditor
            editor={ClassicEditor}
            data={content}
            onChange={handleChange}
            onReady={(editor) => {
              // Load saved content if exists
              const savedContent = localStorage.getItem('editorContent');
              if (savedContent) {
                editor.setData(savedContent);
              }
              
              // You can store the "editor" and use it when needed
              console.log('Editor is ready to use!', editor);
            }}
            config={{
              toolbar: [
                'heading',
                '|',
                'bold',
                'italic',
                'link',
                'bulletedList',
                'numberedList',
                '|',
                'outdent',
                'indent',
                '|',
                'blockQuote',
                'insertTable',
                'undo',
                'redo'
              ]
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;