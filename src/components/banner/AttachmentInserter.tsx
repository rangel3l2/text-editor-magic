import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useBannerImages } from '@/hooks/useBannerImages';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AttachmentInserterProps {
  sectionId: string;
  onInsert: (attachmentId: string, attachmentType: string) => void;
}

const AttachmentInserter = ({ sectionId, onInsert }: AttachmentInserterProps) => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const { images } = useBannerImages(workId, user?.id);

  const sectionImages = images.filter(img => img.section === sectionId).sort((a, b) => a.display_order - b.display_order);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'figura': return '🖼️ Imagem';
      case 'grafico': return '📊 Gráfico';
      case 'tabela': return '📋 Tabela';
      default: return '📎 Anexo';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'figura': return '🖼️';
      case 'grafico': return '📊';
      case 'tabela': return '📋';
      default: return '📎';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Paperclip className="h-4 w-4" />
          Inserir Anexo
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Selecione um anexo para inserir</h4>
          <p className="text-xs text-muted-foreground">
            O anexo será inserido na posição do cursor
          </p>
          <ScrollArea className="h-[200px] w-full rounded-md border p-2">
            {sectionImages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum anexo disponível nesta seção.
                <br />
                Adicione anexos no gerenciador.
              </p>
            ) : (
              <div className="space-y-2">
                {sectionImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      onInsert(img.id, img.image_type || 'figura');
                    }}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors flex items-start gap-2"
                  >
                    <span className="text-2xl">{getTypeIcon(img.image_type || 'figura')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(img.image_type || 'figura')}
                        </Badge>
                      </div>
                      {img.caption && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AttachmentInserter;
