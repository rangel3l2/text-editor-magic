import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Clipboard } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface LogoUploadProps {
  institutionLogo?: string;
  handleChange: (field: string, value: string) => void;
}

const LogoUpload = ({ institutionLogo, handleChange }: LogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();

  const uploadFile = async (file: File) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handlePasteClick = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para fazer upload de imagens",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `logo-${Date.now()}.png`, { type: imageType });
          
          toast({
            title: "Imagem colada",
            description: "Fazendo upload da imagem...",
            duration: 2000,
          });
          
          await uploadFile(file);
          return;
        }
      }
      
      toast({
        title: "Nenhuma imagem encontrada",
        description: "Copie uma imagem primeiro (Ctrl+C) e depois clique em colar",
        variant: "destructive",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Erro ao colar",
        description: "Não foi possível acessar a área de transferência. Use o upload de arquivo.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!user) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadFile(file);
    }
  };

  const handleRemoveLogo = async (e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    // Update UI immediately
    handleChange('institutionLogo', '');

    // Persist change if a work exists
    if (user && id) {
      try {
        const { data, error } = await supabase
          .from('work_in_progress')
          .select('content')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.content) {
          const newContent = { ...(data.content as any), institutionLogo: '' };
          const { error: updateError } = await supabase
            .from('work_in_progress')
            .update({ content: newContent, last_modified: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id);
          if (updateError) throw updateError;
        }

        toast({
          title: 'Logo removido',
          description: 'A alteração foi salva.',
        });
      } catch (err) {
        console.error('Erro ao persistir remoção do logo:', err);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Logo da Instituição</CardTitle>
        <CardDescription>
          {user 
            ? "Faça upload, arraste ou cole uma imagem do logo da sua instituição"
            : "Faça login para poder fazer upload do logo da sua instituição"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {institutionLogo && (
          <div className="relative w-full max-w-md mx-auto mb-4 border-2 border-border rounded-lg p-4 bg-background">
            <img 
              src={institutionLogo} 
              alt="Logo da Instituição" 
              className="w-full h-auto object-contain max-h-32"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={handleRemoveLogo}
            >
              Remover
            </Button>
          </div>
        )}
        
        <div 
          ref={pasteAreaRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border bg-muted/20'
          } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Arraste uma imagem aqui</p>
              <p className="text-xs text-muted-foreground">ou use os botões abaixo</p>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById('logo-file-input')?.click()}
                disabled={uploading || !user}
              >
                <Upload className="w-4 h-4 mr-2" />
                Escolher arquivo
              </Button>
              
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePasteClick}
                disabled={uploading || !user}
              >
                <Clipboard className="w-4 h-4 mr-2" />
                Colar (Ctrl+V)
              </Button>
            </div>
            
            <Input
              id="logo-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading || !user}
              className="hidden"
            />
            
            {uploading && (
              <p className="text-sm text-primary animate-pulse">Enviando imagem...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUpload;