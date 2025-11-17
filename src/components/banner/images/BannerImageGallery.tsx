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
  const [draggedItem, setDraggedItem] = useState<{ section: string; index: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ section: string; index: number } | null>(null);

  // Group images by section
  const imagesBySection = images.reduce((acc, image) => {
    const section = image.section || 'results';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(image);
    return acc;
  }, {} as Record<string, BannerImage[]>);

  const sectionLabels: Record<string, string> = {
    introduction: 'Introdução',
    objectives: 'Objetivos',
    methodology: 'Metodologia',
    results: 'Resultados',
    discussion: 'Discussão',
    conclusion: 'Conclusão'
  };

  const handleDragStart = (section: string, index: number) => {
    setDraggedItem({ section, index });
  };

  const handleDragOver = (e: React.DragEvent, section: string, index: number) => {
    e.preventDefault();
    // Only allow drop within same section
    if (draggedItem?.section === section) {
      setDragOverItem({ section, index });
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, dropSection: string, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.section !== dropSection) return;

    const sectionImages = [...imagesBySection[dropSection]];
    const [draggedImage] = sectionImages.splice(draggedItem.index, 1);
    sectionImages.splice(dropIndex, 0, draggedImage);

    // Rebuild full images array with updated order
    const newImages = Object.keys(imagesBySection).flatMap(section => {
      if (section === dropSection) {
        return sectionImages;
      }
      return imagesBySection[section];
    });

    onReorder(newImages);
    setDraggedItem(null);
    setDragOverItem(null);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{images.length} {images.length === 1 ? 'Imagem' : 'Imagens'}</h3>
        <p className="text-sm text-muted-foreground">Arraste para reordenar dentro de cada seção</p>
      </div>

      {Object.keys(imagesBySection).sort().map(section => {
        const sectionImages = imagesBySection[section];
        const typeCount: Record<string, number> = { figura: 0, grafico: 0, tabela: 0 };
        
        return (
          <div key={section} className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {sectionLabels[section] || section}
              </h4>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {sectionImages.length} {sectionImages.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {sectionImages.map((image, index) => {
                const imageType = image.image_type || 'figura';
                typeCount[imageType] = (typeCount[imageType] || 0) + 1;
                const typeLabel = imageType === 'figura' ? 'Figura' : imageType === 'grafico' ? 'Gráfico' : 'Tabela';
                
                return (
                  <Card
                    key={image.id}
                    draggable
                    onDragStart={() => handleDragStart(section, index)}
                    onDragOver={(e) => handleDragOver(e, section, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, section, index)}
                    className={`
                      transition-all cursor-move
                      ${draggedItem?.section === section && draggedItem?.index === index ? 'opacity-50 scale-95' : ''}
                      ${dragOverItem?.section === section && dragOverItem?.index === index ? 'border-primary border-2' : ''}
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
                            <p className="font-semibold text-sm">{typeLabel} {typeCount[imageType]}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {image.caption}
                            </p>
                          </div>
                          <Badge variant={getDPIBadgeVariant(image.dpi)}>
                            {getDPILabel(image.dpi)} - {image.dpi} DPI
                          </Badge>
                        </div>

                        {image.source && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Fonte:</strong> {image.source}
                          </p>
                        )}

                        {image.width_cm && image.height_cm && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Dimensões:</strong> {image.width_cm.toFixed(1)} × {image.height_cm.toFixed(1)} cm
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(image)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(image.id)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BannerImageGallery;
