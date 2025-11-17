import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { BannerImage } from '@/hooks/useBannerImages';
import { RotateCw, Save, Crop, AlertCircle } from 'lucide-react';
import ImageCropTool from './ImageCropTool';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface BannerImageEditorProps {
  image: BannerImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageId: string, updates: Partial<BannerImage>) => Promise<void>;
}

const BannerImageEditor = ({
  image,
  isOpen,
  onClose,
  onSave
}: BannerImageEditorProps) => {
  const [caption, setCaption] = useState(image?.caption || '');
  const [columnPosition, setColumnPosition] = useState<string>(image?.column_position?.toString() || 'auto');
  const [section, setSection] = useState(image?.section || 'results');
  const [rotation, setRotation] = useState(image?.rotation || 0);
  const [brightness, setBrightness] = useState(image?.adjustments.brightness || 0);
  const [contrast, setContrast] = useState(image?.adjustments.contrast || 0);
  const [saturation, setSaturation] = useState(image?.adjustments.saturation || 0);
  const [showCropTool, setShowCropTool] = useState(false);
  const { toast } = useToast();

  if (!image) return null;

  // Input validation
  const captionError = caption.length > 200 ? 'Legenda muito longa (máximo 200 caracteres)' : 
                       caption.length < 10 ? 'Legenda muito curta (mínimo 10 caracteres)' : null;

  const handleSave = async () => {
    // Validate inputs before saving
    if (caption.length < 10 || caption.length > 200) {
      toast({
        title: 'Erro de validação',
        description: 'A legenda deve ter entre 10 e 200 caracteres',
        variant: 'destructive'
      });
      return;
    }

    // Sanitize caption - remove HTML tags
    const sanitizedCaption = caption.replace(/<[^>]*>/g, '').trim();

    await onSave(image.id, {
      caption: sanitizedCaption,
      section,
      column_position: columnPosition === 'auto' ? null : parseInt(columnPosition),
      rotation,
      adjustments: {
        brightness,
        contrast,
        saturation
      }
    });
    onClose();
  };

  const handleCropSave = async (croppedBlob: Blob, cropData: any) => {
    try {
      // Upload cropped image
      const fileName = `${image.user_id}/${image.work_id}/cropped-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banner_images')
        .upload(fileName, croppedBlob);

      if (uploadError) throw uploadError;

      // Update image with new path and crop data
      await onSave(image.id, {
        storage_path: uploadData.path,
        crop_data: cropData
      });

      toast({
        title: 'Imagem cortada',
        description: 'Corte aplicado com sucesso'
      });
    } catch (error) {
      console.error('Error saving cropped image:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a imagem cortada',
        variant: 'destructive'
      });
    }
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const imageStyle = {
    transform: `rotate(${rotation}deg)`,
    filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={image.url}
                alt={caption}
                style={imageStyle}
                className="max-w-full max-h-[400px] object-contain transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Dimensões: {image.original_width} × {image.original_height} px</span>
              <span>DPI: {image.dpi}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Validation Alerts */}
            {captionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{captionError}</AlertDescription>
              </Alert>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda *</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Figura X - Descrição clara e objetiva"
                rows={3}
                maxLength={200}
                className={captionError ? 'border-destructive' : ''}
              />
              <p className={`text-xs ${captionError ? 'text-destructive' : 'text-muted-foreground'}`}>
                {caption.length}/200 caracteres {captionError && '• ' + captionError}
              </p>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label htmlFor="section">Seção onde a imagem aparecerá</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introduction">Introdução</SelectItem>
                  <SelectItem value="objectives">Objetivos</SelectItem>
                  <SelectItem value="methodology">Metodologia</SelectItem>
                  <SelectItem value="results">Resultados</SelectItem>
                  <SelectItem value="discussion">Discussão</SelectItem>
                  <SelectItem value="conclusion">Conclusão</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A imagem será posicionada no final da seção selecionada
              </p>
            </div>

            {/* Column Position */}
            <div className="space-y-2">
              <Label htmlFor="column">Posição na Coluna</Label>
              <Select value={columnPosition} onValueChange={setColumnPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático</SelectItem>
                  <SelectItem value="1">Coluna 1 (Esquerda)</SelectItem>
                  <SelectItem value="2">Coluna 2 (Centro)</SelectItem>
                  <SelectItem value="3">Coluna 3 (Direita)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Deixe em "Automático" para posicionamento inteligente
              </p>
            </div>

            {/* Rotation and Crop */}
            <div className="space-y-2">
              <Label>Transformações</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="flex-1"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Girar 90°
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCropTool(true)}
                  className="flex-1"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  Cortar
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Rotação atual: {rotation}°
              </span>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-4">Ajustes Visuais</p>

              {/* Brightness */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brightness">Brilho</Label>
                  <span className="text-xs text-muted-foreground">{brightness}%</span>
                </div>
                <Slider
                  id="brightness"
                  value={[brightness]}
                  onValueChange={([value]) => setBrightness(value)}
                  min={-50}
                  max={50}
                  step={5}
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contrast">Contraste</Label>
                  <span className="text-xs text-muted-foreground">{contrast}%</span>
                </div>
                <Slider
                  id="contrast"
                  value={[contrast]}
                  onValueChange={([value]) => setContrast(value)}
                  min={-50}
                  max={50}
                  step={5}
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="saturation">Saturação</Label>
                  <span className="text-xs text-muted-foreground">{saturation}%</span>
                </div>
                <Slider
                  id="saturation"
                  value={[saturation]}
                  onValueChange={([value]) => setSaturation(value)}
                  min={-50}
                  max={50}
                  step={5}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setBrightness(0);
                  setContrast(0);
                  setSaturation(0);
                }}
                className="w-full"
              >
                Resetar Ajustes
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!!captionError}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Crop Tool Dialog */}
      <ImageCropTool
        image={image.url || ''}
        isOpen={showCropTool}
        onClose={() => setShowCropTool(false)}
        onSave={handleCropSave}
      />
    </Dialog>
  );
};

export default BannerImageEditor;
