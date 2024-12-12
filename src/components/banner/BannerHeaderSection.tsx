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
          description: "Você precisa estar logado para fazer upload de imagens",
          variant: "destructive",
          duration: 3000,
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
        description: "Não foi possível enviar o logo da instituição",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Logo da Instituição</CardTitle>
          <CardDescription>Faça upload do logo da sua instituição (formato PNG ou JPG recomendado)</CardDescription>
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
              disabled={uploading}
            />
            {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Nome da Instituição</CardTitle>
          <CardDescription>Digite o nome completo da instituição</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.institution}
            onChange={(data) => handleChange('institution', data)}
            maxLines={2}
            config={editorConfig}
            placeholder="Digite o nome completo da instituição..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Título do Trabalho</CardTitle>
          <CardDescription>Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.title}
            onChange={(data) => handleChange('title', data)}
            maxLines={2}
            config={editorConfig}
            placeholder="Digite um título breve e atrativo que indique o tema principal do trabalho..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Autores</CardTitle>
          <CardDescription>Liste os nomes dos autores, seguidos da afiliação institucional e e-mail de contato do autor principal. (3 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.authors}
            onChange={(data) => handleChange('authors', data)}
            maxLines={3}
            config={editorConfig}
            placeholder="Nome dos autores, afiliação institucional e e-mail de contato..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerHeaderSection;