import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Json } from '@/integrations/supabase/types';
import Cropper from 'react-easy-crop';

// Define the types locally instead of importing from react-easy-crop/types
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
  [key: string]: Json;
}

interface ImageCropDialogProps {
  imageUrl: string;
  initialConfig?: ImageConfig;
  onSave: (config: ImageConfig) => void;
  onCancel: () => void;
}

const ImageCropDialog = ({
  imageUrl,
  initialConfig,
  onSave,
  onCancel
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');

  useEffect(() => {
    if (initialConfig) {
      setZoom(initialConfig.scale || 1);
      setRotation(initialConfig.rotation || 0);
      setAlignment(initialConfig.alignment || 'center');
      if (initialConfig.crop) {
        setCrop({ x: initialConfig.crop.x, y: initialConfig.crop.y });
      }
    }
  }, [initialConfig]);

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = () => {
    const config: ImageConfig = {
      scale: zoom,
      rotation,
      alignment,
      crop: croppedAreaPixels ? {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height
      } : undefined
    };
    onSave(config);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-[400px]">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={16/9}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Zoom:</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-64"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Rotação:</label>
          <input
            type="range"
            min={0}
            max={360}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-64"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Alinhamento:</label>
          <div className="flex gap-2">
            <Button
              variant={alignment === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlignment('left')}
            >
              Esquerda
            </Button>
            <Button
              variant={alignment === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlignment('center')}
            >
              Centro
            </Button>
            <Button
              variant={alignment === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlignment('right')}
            >
              Direita
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropDialog;