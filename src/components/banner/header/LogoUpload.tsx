import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LogoUploadProps {
  institutionLogo?: string;
  handleChange: (field: string, value: string) => void;
}

const LogoUpload = ({ institutionLogo, handleChange }: LogoUploadProps) => {
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

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('banner_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banner_images')
        .getPublicUrl(filePath);

      // Insert into banner_images table with user_id
      const { error: dbError } = await supabase
        .from('banner_images')
        .insert({
          image_url: publicUrl,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Database error:', dbError);
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

  return (
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
        {institutionLogo && (
          <div className="w-40 h-40 mx-auto mb-4">
            <img 
              src={institutionLogo} 
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
  );
};

export default LogoUpload;