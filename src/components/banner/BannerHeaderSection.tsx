import { useState, useCallback } from 'react';
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
    advisors?: string;
  };
  handleChange: (field: string, data: string) => void;
}

const BannerHeaderSection = ({ content, handleChange }: BannerHeaderSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
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

  const formatAuthors = useCallback(async (authorsText: string) => {
    if (isFormatting) return;
    
    try {
      setIsFormatting(true);
      console.log('Formatting authors:', authorsText);
      
      const { data, error } = await supabase.functions.invoke('format-authors', {
        body: { authors: authorsText }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to format authors: ${error.message}`);
      }

      if (!data?.formattedAuthors) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from formatting service');
      }

      console.log('Formatted authors:', data.formattedAuthors);
      handleChange('authors', data.formattedAuthors);

      toast({
        title: "Nomes formatados",
        description: "Os nomes foram formatados de acordo com as normas ABNT",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error formatting authors:', error);
      toast({
        title: "Erro ao formatar nomes",
        description: error.message || "Não foi possível formatar os nomes automaticamente",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsFormatting(false);
    }
  }, [handleChange, toast, isFormatting]);

  const handleAuthorsChange = useCallback(async (value: string) => {
    handleChange('authors', value);
    if (value && value.replace(/<[^>]*>/g, '').trim()) {
      await formatAuthors(value);
    }
  }, [handleChange, formatAuthors]);

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
          <CardTitle>4. Discentes</CardTitle>
          <CardDescription>Liste os nomes dos alunos autores do trabalho. Os nomes serão automaticamente formatados de acordo com as normas ABNT. (1-2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.authors}
            onChange={handleAuthorsChange}
            maxLines={2}
            minLines={1}
            config={editorConfig}
            placeholder="Nome dos alunos autores do trabalho..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Docentes</CardTitle>
          <CardDescription>Liste os nomes dos professores orientadores, incluindo titulação (Dr., Prof., etc). Os nomes serão automaticamente formatados de acordo com as normas ABNT. (1-2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.advisors || ""}
            onChange={(data) => handleChange('advisors', data)}
            maxLines={2}
            minLines={1}
            config={editorConfig}
            placeholder="Nome dos professores orientadores..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerHeaderSection;