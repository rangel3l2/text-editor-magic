import { FileImage, BarChart3, Table2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BannerImage } from '@/hooks/useBannerImages';

interface SectionAttachmentIndicatorProps {
  sectionName: string;
  attachments: BannerImage[];
}

const SectionAttachmentIndicator = ({ sectionName, attachments }: SectionAttachmentIndicatorProps) => {
  if (attachments.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'figura':
        return <FileImage className="h-3.5 w-3.5" />;
      case 'grafico':
        return <BarChart3 className="h-3.5 w-3.5" />;
      case 'tabela':
        return <Table2 className="h-3.5 w-3.5" />;
      default:
        return <FileImage className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'figura':
        return 'Figura';
      case 'grafico':
        return 'Gráfico';
      case 'tabela':
        return 'Tabela';
      default:
        return 'Anexo';
    }
  };

  return (
    <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <AlertDescription>
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            📎
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {attachments.length} {attachments.length === 1 ? 'anexo será inserido' : 'anexos serão inseridos'} nesta seção:
            </p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => {
                const typeLabel = getTypeLabel(attachment.image_type || 'figura');
                const typeCount = attachments
                  .filter((a, i) => i <= index && a.image_type === attachment.image_type)
                  .length;
                
                return (
                  <Badge
                    key={attachment.id}
                    variant="secondary"
                    className="text-xs flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                  >
                    {getIcon(attachment.image_type || 'figura')}
                    <span className="font-medium">
                      {typeLabel} {typeCount}
                    </span>
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Os anexos aparecerão automaticamente nesta seção ao gerar o banner. Continue escrevendo normalmente abaixo.
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default SectionAttachmentIndicator;
