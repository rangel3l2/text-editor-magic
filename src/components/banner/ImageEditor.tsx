import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageEditorProps {
  imageUrl: string;
  config: any;
  onConfigChange: (config: any) => void;
}

const ImageEditor = ({ imageUrl, config, onConfigChange }: ImageEditorProps) => {
  const [crop, setCrop] = useState(config.crop || { x: 0, y: 0, width: 100, height: 100 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0 });

  const handleCropChange = (values: number[]) => {
    const newCrop = {
      ...crop,
      width: values[0],
      height: values[1]
    };
    setCrop(newCrop);
    onConfigChange({ ...config, crop: newCrop });
  };

  const handlePositionChange = (values: number[]) => {
    const newPosition = { x: values[0], y: values[1] };
    setPosition(newPosition);
    onConfigChange({ ...config, position: newPosition });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Imagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AspectRatio ratio={16/9}>
          <img
            src={imageUrl}
            alt="Preview"
            className="object-cover rounded-lg"
            style={{
              transform: `translate(${position.x}%, ${position.y}%)`,
              clipPath: `inset(${crop.x}% ${crop.y}% ${100-crop.width}% ${100-crop.height}%)`
            }}
          />
        </AspectRatio>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recorte</h4>
          <Slider
            defaultValue={[crop.width, crop.height]}
            max={100}
            step={1}
            onValueChange={handleCropChange}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Posição</h4>
          <Slider
            defaultValue={[position.x, position.y]}
            max={100}
            step={1}
            onValueChange={handlePositionChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageEditor;