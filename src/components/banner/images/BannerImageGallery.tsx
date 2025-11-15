import { useState } from 'react';
import { GripVertical, Trash2, Edit, ZoomIn } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BannerImage } from '@/hooks/useBannerImages';
import { Badge } from '@/components/ui/badge';

interface BannerImageGalleryProps {
  images: BannerImage[];
  onReorder: (images: BannerImage[]) => void;
  onEdit: (image: BannerImage) => void;
  onDelete: (imageId: string) => void;
}

const BannerImageGallery = ({
  images,
  onReorder,
  onEdit,
  onDelete
}: BannerImageGalleryProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onReorder(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getDPIBadgeVariant = (dpi: number) => {
    if (dpi >= 300) return 'default';
    if (dpi >= 200) return 'secondary';
    return 'destructive';
  };

  const getDPILabel = (dpi: number) => {
    if (dpi >= 300) return '✅ Ótimo';
    if (dpi >= 200) return '⚠️ Aceitável';
    return '❌ Baixa';
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma imagem adicionada ainda</p>
        <p className="text-sm mt-2">Faça upload de imagens para seus resultados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{images.length} {images.length === 1 ? 'Imagem' : 'Imagens'}</h3>
        <p className="text-sm text-muted-foreground">Arraste para reordenar</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {images.map((image, index) => (
          <Card
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              transition-all cursor-move
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index ? 'border-primary border-2' : ''}
            `}
          >
            <div className="p-4 flex gap-4">
              <div className="flex-shrink-0 flex items-center">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex-shrink-0 w-24 h-24 bg-muted rounded overflow-hidden">
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">Figura {index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.caption}
                    </p>
                  </div>
                  <Badge variant={getDPIBadgeVariant(image.dpi)}>
                    {getDPILabel(image.dpi)} - {image.dpi} DPI
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{image.original_width} × {image.original_height} px</span>
                  {image.column_position && (
                    <>
                      <span>•</span>
                      <span>Coluna {image.column_position}</span>
                    </>
                  )}
                  {image.rotation !== 0 && (
                    <>
                      <span>•</span>
                      <span>Rotação: {image.rotation}°</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(image)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Deseja realmente excluir esta imagem?')) {
                      onDelete(image.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannerImageGallery;
