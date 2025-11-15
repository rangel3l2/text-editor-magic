import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface BannerTemplatePreset {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  structure: {
    sections: string[];
    headerElements: string[];
    footerElements: string[];
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    sectionHeader: string;
  };
  typography: {
    titleFont: string;
    titleSize: string;
    headingFont: string;
    headingSize: string;
    bodyFont: string;
    bodySize: string;
    captionSize: string;
  };
  layout_config: {
    columns: number;
    marginTop: string;
    marginBottom: string;
    marginLeft: string;
    marginRight: string;
    columnGap: string;
    sectionSpacing: string;
  };
}

export const useBannerTemplates = () => {
  const [templates, setTemplates] = useState<BannerTemplatePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_template_presets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Parse JSONB fields to proper types
      const parsedTemplates = (data || []).map(template => ({
        ...template,
        structure: template.structure as BannerTemplatePreset['structure'],
        colors: template.colors as BannerTemplatePreset['colors'],
        typography: template.typography as BannerTemplatePreset['typography'],
        layout_config: template.layout_config as BannerTemplatePreset['layout_config'],
      }));

      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('Error loading banner templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates de banner",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    templates,
    isLoading,
    reloadTemplates: loadTemplates
  };
};
