import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Columns2, Columns3, Sparkles } from 'lucide-react';
import { useBannerTemplates, BannerTemplatePreset } from '@/hooks/useBannerTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface BannerTemplateSelectorProps {
  onSelectTemplate: (template: BannerTemplatePreset) => void;
  currentTemplateId?: string;
}

const BannerTemplateSelector = ({ onSelectTemplate, currentTemplateId }: BannerTemplateSelectorProps) => {
  const { templates, isLoading } = useBannerTemplates();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates de Banner</CardTitle>
          <CardDescription>Carregando templates disponíveis...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Templates de Banner
        </CardTitle>
        <CardDescription>
          Escolha um template profissional baseado nos padrões da FeciTEL e personalize conforme necessário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant={currentTemplateId === template.id ? 'default' : 'outline'}
            className="w-full h-auto p-4 flex flex-col items-start gap-2"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="flex items-start justify-between w-full">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                <span className="font-semibold text-base">{template.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {template.layout_config.columns === 2 ? (
                  <Columns2 className="w-4 h-4" />
                ) : (
                  <Columns3 className="w-4 h-4" />
                )}
                <span className="text-xs">{template.layout_config.columns} cols</span>
              </div>
            </div>
            
            {template.description && (
              <p className="text-xs text-muted-foreground text-left">
                {template.description}
              </p>
            )}
            
            <div className="flex gap-1 flex-wrap">
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: template.colors.primary, color: '#ffffff' }}
                className="h-5"
              >
                Primária
              </Badge>
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: template.colors.secondary, color: '#ffffff' }}
                className="h-5"
              >
                Secundária
              </Badge>
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: template.colors.accent, color: '#ffffff' }}
                className="h-5"
              >
                Destaque
              </Badge>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default BannerTemplateSelector;
