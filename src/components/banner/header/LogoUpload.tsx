import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Clipboard, Settings } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LogoConfig {
  maxHeight: number; // in rem
  width?: number; // largura em % da área disponível (20-100)
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position?: {
    x: number;
    y: number;
  };
}

interface LogoUploadProps {
  institutionLogo?: string;
  logoConfig?: LogoConfig;
  handleChange: (field: string, value: any) => void;
}

const LogoUpload = ({ institutionLogo, logoConfig, handleChange }: LogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [maxHeight, setMaxHeight] = useState(logoConfig?.maxHeight || 10);
  const [logoWidth, setLogoWidth] = useState(logoConfig?.width || 40);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();

  useEffect(() => {
    if (logoConfig) {
      setMaxHeight(logoConfig.maxHeight || 10);
      setLogoWidth(logoConfig.width || 40);
      if (logoConfig.crop) {
        setCrop({ x: logoConfig.crop.x, y: logoConfig.crop.y });
      }
    }
  }, [logoConfig]);

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
        // Use backend function to persist (avoids CORS issues)
        const { error: fnError } = await supabase.functions.invoke('update-work-content', {
          body: { id, contentPatch: { institutionLogo: '' } }
        });

        if (fnError) throw fnError;

        toast({
          title: 'Logo removido',
          description: 'A alteração foi salva.',
        });
      } catch (err) {
        console.error('Erro ao persistir remoção do logo (function):', err);
        // Fallback direto no banco
        try {
          const { data, error } = await supabase
            .from('work_in_progress')
            .select('content')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;

          const newContent = { ...(data?.content as any || {}), institutionLogo: '' };
          const { error: updateError } = await supabase
            .from('work_in_progress')
            .update({ content: newContent, last_modified: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id);
          if (updateError) throw updateError;

          toast({
            title: 'Logo removido',
            description: 'A alteração foi salva.',
          });
        } catch (fallbackErr) {
          console.error('Erro ao persistir remoção do logo (fallback):', fallbackErr);
        }
      }
    }
  };

  const handleSaveConfig = async () => {
    const newConfig: LogoConfig = {
      maxHeight: maxHeight,
      width: logoWidth,
      crop: croppedAreaPixels ? {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height
      } : logoConfig?.crop,
      position: logoConfig?.position || { x: 0, y: 0 }
    };
    
    handleChange('logoConfig', newConfig);
    
    if (user && id) {
      try {
        const { error: fnError } = await supabase.functions.invoke('update-work-content', {
          body: { id, contentPatch: { logoConfig: newConfig } }
        });
        if (fnError) throw fnError;
        
        toast({
          title: 'Configuração salva',
          description: `Logo: ${logoWidth}% largura, ${maxHeight}rem altura${croppedAreaPixels ? ', com crop aplicado' : ''}`,
        });
      } catch (err) {
        console.error('Erro ao salvar configuração do logo:', err);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Configuração aplicada',
        description: `Logo: ${logoWidth}% largura, ${maxHeight}rem altura`,
      });
    }
    
    setShowConfigDialog(false);
    setShowCropDialog(false);
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
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
              className="w-full h-auto object-contain"
              style={{ maxHeight: `${maxHeight}rem` }}
            />
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfigDialog(true)}
                disabled={!user}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveLogo}
              >
                Remover
              </Button>
            </div>
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

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Logo</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Altura Máxima: {maxHeight}rem (padrão banner: 8-12rem)
              </label>
              <Slider
                value={[maxHeight]}
                onValueChange={([v]) => setMaxHeight(v)}
                min={4}
                max={20}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Padrão científico recomendado: 8-12rem
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                Largura: {logoWidth}% da área disponível
              </label>
              <Slider
                value={[logoWidth]}
                onValueChange={([v]) => setLogoWidth(v)}
                min={20}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Para faixas horizontais, use 80-100%
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowConfigDialog(false);
                  setShowCropDialog(true);
                }}
              >
                Ajustar Crop/Enquadramento (cortar partes)
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ajustar Enquadramento do Logo</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Arraste para reposicionar, use zoom para cortar partes superior/inferior (ideal para faixas)
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="relative h-[500px] bg-muted rounded-lg overflow-hidden">
              {institutionLogo && (
                <Cropper
                  image={institutionLogo}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={undefined}
                  objectFit="horizontal-cover"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                  cropShape="rect"
                />
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Zoom: {zoom.toFixed(1)}x (use para cortar topo/base)</label>
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={1}
                  max={3}
                  step={0.05}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rotação: {rotation}°</label>
                <Slider
                  value={[rotation]}
                  onValueChange={([v]) => setRotation(v)}
                  min={-45}
                  max={45}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setZoom(1); setRotation(0); }}
                >
                  Resetar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoom(zoom + 0.1)}
                >
                  Zoom +
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                >
                  Zoom -
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCropDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig}>
                Aplicar Corte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LogoUpload;