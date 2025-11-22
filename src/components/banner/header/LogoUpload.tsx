import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Clipboard, Settings, RotateCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();

  useEffect(() => {
    if (logoConfig) {
      setMaxHeight(logoConfig.maxHeight || 10);
      setLogoWidth(logoConfig.width || 40);
      if (logoConfig.crop) {
        setCrop({
          unit: '%',
          x: logoConfig.crop.x,
          y: logoConfig.crop.y,
          width: logoConfig.crop.width,
          height: logoConfig.crop.height
        });
        setCompletedCrop({
          unit: '%',
          x: logoConfig.crop.x,
          y: logoConfig.crop.y,
          width: logoConfig.crop.width,
          height: logoConfig.crop.height
        });
      }
    }
  }, [logoConfig]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });

    // If we already have a crop in config, normalize it to percentages for the UI
    if (logoConfig?.crop) {
      const c = logoConfig.crop as any;
      const looksPixel = c.width > 100 || c.height > 100 || c.x > 100 || c.y > 100;
      if (looksPixel) {
        const pctCrop: Crop = {
          unit: '%',
          x: (c.x / naturalWidth) * 100,
          y: (c.y / naturalHeight) * 100,
          width: (c.width / naturalWidth) * 100,
          height: (c.height / naturalHeight) * 100,
        };
        setCrop(pctCrop);
        setCompletedCrop(pctCrop);
        return;
      }
    }

    // Initialize with full image when no crop
    if (!logoConfig?.crop) {
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    }
  };

  // Calculate pixel dimensions from percentage crop
  const getPixelDimensions = () => {
    if (!imageDimensions) return { width: 0, height: 0 };
    return {
      width: Math.round((crop.width / 100) * imageDimensions.width),
      height: Math.round((crop.height / 100) * imageDimensions.height)
    };
  };

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
      const filePath = `logos/${user.id}/${crypto.randomUUID()}.${fileExt}`;

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

      // Update UI immediately
      handleChange('institutionLogo', publicUrl);
      
      // Reset crop/position so a recorte antigo não "expulse" a nova imagem da tela
      const defaultConfig = {
        maxHeight: logoConfig?.maxHeight || 10,
        width: logoConfig?.width || 100,
        position: { x: 0, y: 0 },
        crop: { x: 0, y: 0, width: 100, height: 100 },
      };
      handleChange('logoConfig', defaultConfig);

      // Save to localStorage as backup
      localStorage.setItem(`banner_logo_${id}`, publicUrl);
      localStorage.setItem(`banner_logo_config_${id}`, JSON.stringify(defaultConfig));

      // Save to database immediately if work exists
      if (id) {
        try {
          const { error: fnError } = await supabase.functions.invoke('update-work-content', {
            body: { 
              id, 
              contentPatch: { 
                institutionLogo: publicUrl,
                logoConfig: defaultConfig
              } 
            }
          });
          if (fnError) throw fnError;
        } catch (err) {
          console.error('Erro ao salvar logo no banco:', err);
        }
      }

      toast({
        title: "Logo enviado com sucesso",
        description: "O logo da instituição foi atualizado e salvo",
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
    
    // Clear localStorage
    if (id) {
      localStorage.removeItem(`banner_logo_${id}`);
      localStorage.removeItem(`banner_logo_config_${id}`);
    }

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
    const cropToSave = completedCrop || crop;
    const newConfig: LogoConfig = {
      maxHeight: maxHeight,
      width: logoWidth,
      crop: {
        x: cropToSave.x,
        y: cropToSave.y,
        width: cropToSave.width,
        height: cropToSave.height
      },
      position: logoConfig?.position || { x: 0, y: 0 }
    };
    
    handleChange('logoConfig', newConfig);
    
    // Save to localStorage
    if (id) {
      localStorage.setItem(`banner_logo_config_${id}`, JSON.stringify(newConfig));
    }
    
    if (user && id) {
      try {
        const { error: fnError } = await supabase.functions.invoke('update-work-content', {
          body: { id, contentPatch: { logoConfig: newConfig } }
        });
        if (fnError) throw fnError;
        
        toast({
          title: 'Configuração salva',
          description: `Crop aplicado: ${cropToSave.width.toFixed(0)}%×${cropToSave.height.toFixed(0)}%`,
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

  const handleResetCrop = () => {
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
    setCompletedCrop(null);
    setAspectRatio(undefined);
  };

  const handleAspectRatioChange = (value: string) => {
    if (value === 'freeform') {
      setAspectRatio(undefined);
    } else if (value === '16:9') {
      setAspectRatio(16 / 9);
    } else if (value === '21:9') {
      setAspectRatio(21 / 9);
    } else if (value === '16:3') {
      setAspectRatio(16 / 3);
    } else if (value === '1:1') {
      setAspectRatio(1);
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
            <div 
              className="relative w-full mx-auto overflow-hidden bg-muted flex items-center justify-center"
              style={{ 
                maxHeight: `${maxHeight}rem`,
                height: (logoConfig?.crop && logoConfig.crop.width < 100) ? `${maxHeight}rem` : 'auto'
              }}
            >
              <img 
                src={institutionLogo} 
                alt="Logo da Instituição" 
                className="object-contain"
                style={{
                  maxHeight: (logoConfig?.crop && logoConfig.crop.width < 100) ? 'none' : `${maxHeight}rem`,
                  width: (logoConfig?.crop && logoConfig.crop.width < 100) 
                    ? `${10000 / logoConfig.crop.width}%` 
                    : '100%',
                  height: 'auto',
                  transform: (logoConfig?.crop && logoConfig.crop.width < 100)
                    ? `translate(${-logoConfig.crop.x}%, ${-logoConfig.crop.y}%)` 
                    : 'none',
                  display: 'block'
                }}
              />
            </div>
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
            <DialogDescription>
              Ajuste a altura e largura do logo no banner
            </DialogDescription>
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
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <div className="flex h-[95vh]">
            {/* Left Panel - Controls */}
            <div className="w-80 border-r border-border p-6 flex flex-col gap-6 overflow-y-auto">
              <DialogHeader className="p-0">
                <DialogTitle>Recortar Logo</DialogTitle>
                <DialogDescription>
                  Arraste as alças para selecionar a área que deseja manter
                </DialogDescription>
              </DialogHeader>

              {/* Crop Rectangle Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Crop Rectangle</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Width</label>
                    <Input
                      type="number"
                      value={imageDimensions ? Math.round((crop.width / 100) * imageDimensions.width) : 0}
                      onChange={(e) => {
                        if (!imageDimensions) return;
                        const px = Number(e.target.value) || 0;
                        const pct = Math.max(1, Math.min(100, (px / imageDimensions.width) * 100));
                        setCrop({ ...crop, width: pct });
                      }}
                      min={1}
                      max={imageDimensions?.width}
                      className="h-9"
                    />
                    {imageDimensions && (
                      <p className="text-xs text-muted-foreground">{Math.round((crop.width / 100) * imageDimensions.width)}px</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Height</label>
                    <Input
                      type="number"
                      value={Math.round(crop.height)}
                      onChange={(e) => setCrop({ ...crop, height: Number(e.target.value) })}
                      className="h-9"
                    />
                    {imageDimensions && (
                      <p className="text-xs text-muted-foreground">{getPixelDimensions().height}px</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Aspect Ratio</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={aspectRatio === undefined ? 'freeform' : aspectRatio === 16/9 ? '16:9' : aspectRatio === 21/9 ? '21:9' : aspectRatio === 16/3 ? '16:3' : aspectRatio === 1 ? '1:1' : 'freeform'}
                  onChange={(e) => handleAspectRatioChange(e.target.value)}
                >
                  <option value="freeform">FreeForm</option>
                  <option value="16:9">16:9</option>
                  <option value="21:9">21:9 (Ultra Wide)</option>
                  <option value="16:3">16:3 (Banner)</option>
                  <option value="1:1">1:1 (Quadrado)</option>
                </select>
              </div>

              {/* Crop Position */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Crop Position</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Position (Y)</label>
                    <Input
                      type="number"
                      value={Math.round(crop.y)}
                      onChange={(e) => setCrop({ ...crop, y: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Position (X)</label>
                    <Input
                      type="number"
                      value={Math.round(crop.x)}
                      onChange={(e) => setCrop({ ...crop, x: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <Button 
                variant="outline" 
                onClick={handleResetCrop}
                className="w-full"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 mt-auto border-t">
                <Button onClick={handleSaveConfig} className="w-full" size="lg">
                  Crop →
                </Button>
                <Button variant="outline" onClick={() => setShowCropDialog(false)} className="w-full">
                  Cancelar
                </Button>
              </div>
            </div>

            {/* Right Panel - Image Preview */}
            <div className="flex-1 bg-muted p-8 flex items-center justify-center overflow-hidden relative">
              {institutionLogo && (
                <>
                  <ReactCrop
                    crop={crop}
                    onChange={(c, pc) => {
                      setCrop(c);
                      setCompletedCrop(pc);
                    }}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspectRatio}
                    className="max-h-full max-w-full"
                  >
                    <img
                      ref={imgRef}
                      src={institutionLogo}
                      alt="Logo para recorte"
                      onLoad={onImageLoad}
                      style={{
                        maxHeight: 'calc(95vh - 64px)',
                        maxWidth: '100%',
                        display: 'block'
                      }}
                    />
                  </ReactCrop>
                  
                  {/* Floating dimension indicator */}
                  {imageDimensions && crop.width > 0 && crop.height > 0 && (
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg font-mono text-sm">
                      {getPixelDimensions().width} × {getPixelDimensions().height} px
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LogoUpload;