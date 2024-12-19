import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Crop, Move } from "lucide-react";

interface ImageCropDialogProps {
  imageUrl: string;
  onSave: (config: ImageConfig) => void;
  onCancel: () => void;
  initialConfig?: ImageConfig;
}

export interface ImageConfig {
  scale: number;
  rotation: number;
  alignment: 'left' | 'center' | 'right';
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const ImageCropDialog = ({ imageUrl, onSave, onCancel, initialConfig }: ImageCropDialogProps) => {
  const [scale, setScale] = useState(initialConfig?.scale || 1);
  const [rotation, setRotation] = useState(initialConfig?.rotation || 0);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(
    initialConfig?.alignment || 'center'
  );

  const handleSave = () => {
    onSave({
      scale,
      rotation,
      alignment,
      crop: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    });
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Editar Imagem</DialogTitle>
        <DialogDescription>
          Ajuste o tamanho, rotação e alinhamento da imagem.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-contain transition-transform"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tamanho</Label>
              <Crop className="h-4 w-4 text-muted-foreground" />
            </div>
            <Slider
              value={[scale * 100]}
              onValueChange={([value]) => setScale(value / 100)}
              min={50}
              max={150}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rotação</Label>
              <Move className="h-4 w-4 text-muted-foreground" />
            </div>
            <Slider
              value={[rotation]}
              onValueChange={([value]) => setRotation(value)}
              min={-180}
              max={180}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Alinhamento</Label>
            <ToggleGroup type="single" value={alignment} onValueChange={(value: any) => setAlignment(value)}>
              <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Centralizar">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Alinhar à direita">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default ImageCropDialog;