import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RichTextEditor from '../RichTextEditor';
import editorConfig from '@/config/editorConfig';

interface BannerHeaderSectionProps {
  content: {
    title: string;
    authors: string;
    institution: string;
    institutionLogo?: string;
  };
  handleChange: (field: string, data: string) => void;
}

const BannerHeaderSection = ({ content, handleChange }: BannerHeaderSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) {
        toast({
          title: "Erro ao enviar logo",
          description: "Você precisa estar logado para fazer upload de imagens. Por favor, faça login primeiro.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('banner_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banner_images')
        .getPublicUrl(filePath);

      // Create a record in the banner_images table with user_id
      const { error: dbError } = await supabase
        .from('banner_images')
        .insert({
          image_url: publicUrl,
          user_id: user.id
        });

      if (dbError) {
        throw dbError;
      }

      handleChange('institutionLogo', publicUrl);

      toast({
        title: "Logo enviado com sucesso",
        description: "O logo da instituição foi atualizado",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro ao enviar logo",
        description: "Não foi possível enviar o logo da instituição. Por favor, tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const formatAuthors = async (authorsText: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/format-authors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ authors: authorsText }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to format authors');
      }

      const { formattedAuthors } = await response.json();
      handleChange('authors', formattedAuthors);

      toast({
        title: "Autores formatados",
        description: "Os nomes dos autores foram formatados de acordo com as normas ABNT",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error formatting authors:', error);
      toast({
        title: "Erro ao formatar autores",
        description: "Não foi possível formatar os nomes dos autores automaticamente",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleAuthorsChange = async (value: string) => {
    handleChange('authors', value);
    // Only format if there's actual content and it's not just HTML tags
    if (value && value.replace(/<[^>]*>/g, '').trim()) {
      await formatAuthors(value);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Logo da Instituição</CardTitle>
          <CardDescription>
            {user 
              ? "Faça upload do logo da sua instituição (formato PNG ou JPG recomendado)"
              : "Faça login para poder fazer upload do logo da sua instituição"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.institutionLogo && (
            <div className="w-40 h-40 mx-auto mb-4">
              <img 
                src={content.institutionLogo} 
                alt="Logo da Instituição" 
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading || !user}
            />
            {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Nome da Instituição</CardTitle>
          <CardDescription>Digite o nome completo da instituição (2-3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.institution}
            onChange={(data) => handleChange('institution', data)}
            maxLines={3}
            minLines={2}
            config={editorConfig}
            placeholder="Digite o nome completo da instituição..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Título do Trabalho</CardTitle>
          <CardDescription>Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (2-3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.title}
            onChange={(data) => handleChange('title', data)}
            maxLines={3}
            minLines={2}
            config={editorConfig}
            placeholder="Digite um título breve e atrativo que indique o tema principal do trabalho..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Autores</CardTitle>
          <CardDescription>Liste os nomes dos autores, seguidos da afiliação institucional e e-mail de contato do autor principal. Os nomes serão automaticamente formatados de acordo com as normas ABNT. (2-3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.authors}
            onChange={handleAuthorsChange}
            maxLines={3}
            minLines={2}
            config={editorConfig}
            placeholder="Nome dos autores, afiliação institucional e e-mail de contato..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerHeaderSection;