import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Columns2, Columns3, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useBannerTemplates, BannerTemplatePreset } from '@/hooks/useBannerTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface BannerTemplateSelectorProps {
  onSelectTemplate: (template: BannerTemplatePreset) => void;
  currentTemplateId?: string;
}

const BannerTemplateSelector = ({ onSelectTemplate, currentTemplateId }: BannerTemplateSelectorProps) => {
  const { templates, isLoading } = useBannerTemplates();
  const [isExpanded, setIsExpanded] = useState(!currentTemplateId);

  const selectedTemplate = templates.find(t => t.id === currentTemplateId);

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

  // Vista minimizada quando um template está selecionado e não expandido
  if (currentTemplateId && !isExpanded && selectedTemplate) {
    return (
      <Button
        variant="outline"
        className="w-full flex items-center justify-between gap-2 p-3"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">{selectedTemplate.name}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle>Templates de Banner</CardTitle>
          </div>
          {currentTemplateId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Escolha um template profissional e personalize conforme necessário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant={currentTemplateId === template.id ? 'default' : 'outline'}
            className="w-full h-auto p-0 flex flex-col items-start gap-0 overflow-hidden"
            onClick={() => {
              onSelectTemplate(template);
              setIsExpanded(false);
            }}
          >
            {/* Preview visual do template */}
            {template.thumbnail_url && (
              <div className="w-full h-32 overflow-hidden">
                <img 
                  src={template.thumbnail_url} 
                  alt={`Preview ${template.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="w-full p-4 flex flex-col gap-2">
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
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default BannerTemplateSelector;
