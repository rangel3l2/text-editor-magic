import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BannerEditor = () => {
  const [bannerContent, setBannerContent] = useState({
    title: '',
    subtitle: '',
    description: '',
    callToAction: ''
  });
  
  const { toast } = useToast();
  
  const handleChange = (field: string, data: string) => {
    setBannerContent(prev => ({
      ...prev,
      [field]: data
    }));
    
    // Auto-save functionality
    localStorage.setItem('bannerContent', JSON.stringify({
      ...bannerContent,
      [field]: data
    }));
    
    toast({
      title: "Content saved",
      description: "Your banner content has been automatically saved",
      duration: 2000,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Banner Title</CardTitle>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.title}
            onChange={(_event, editor) => {
              handleChange('title', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', '|', 'undo', 'redo']
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subtitle</CardTitle>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.subtitle}
            onChange={(_event, editor) => {
              handleChange('subtitle', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', '|', 'undo', 'redo']
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.description}
            onChange={(_event, editor) => {
              handleChange('description', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo']
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call to Action</CardTitle>
        </CardHeader>
        <CardContent>
          <CKEditor
            editor={ClassicEditor}
            data={bannerContent.callToAction}
            onChange={(_event, editor) => {
              handleChange('callToAction', editor.getData());
            }}
            config={{
              toolbar: ['bold', 'italic', 'link', '|', 'undo', 'redo']
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerEditor;