import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Crop, Move } from "lucide-react";

interface ImageCropDialogProps {
  imageUrl: string;
  onSave: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropDialog = ({ imageUrl, onSave, onCancel }: ImageCropDialogProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const handleSave = () => {
    if (!imageRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match the displayed image size
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;

      // Apply transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Draw the image with crop offset
      ctx.drawImage(
        imageRef.current,
        crop.x,
        crop.y,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to base64
      const croppedImage = canvas.toDataURL('image/png');
      onSave(croppedImage);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Erro ao processar imagem",
        description: "Não foi possível processar a imagem. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Editar Imagem</DialogTitle>
        <DialogDescription>
          Ajuste o tamanho, rotação e posição da imagem conforme necessário.
        </DialogDescription>
      </DialogHeader>

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-contain"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${crop.x}px, ${crop.y}px)`,
            transition: 'transform 0.2s'
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