import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateLatexContent } from '@/utils/latexProcessor';
import BannerPreviewContent from './BannerPreviewContent';
import type { LogoConfig } from "./header/LogoUpload";
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface BannerPreviewProps {
  content: any;
  onImageConfigChange: (imageId: string, config: any) => void;
  onLogoConfigChange?: (config: LogoConfig) => void;
}

const BannerPreview = ({ content, onImageConfigChange, onLogoConfigChange }: BannerPreviewProps) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const { toast } = useToast();
  const { id: workId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    const generatePreview = async () => {
      try {
        // Load images from database
        let images: any[] = [];
        if (workId && user?.id) {
          const { data, error } = await supabase
            .from('banner_work_images')
            .select('*')
            .eq('work_id', workId)
            .eq('user_id', user.id)
            .order('display_order', { ascending: true });

          if (!error && data) {
            // Get public URLs for images
            images = await Promise.all(
              data.map(async (img) => {
                const { data: urlData } = supabase.storage
                  .from('banner_images')
                  .getPublicUrl(img.storage_path);
                
                return {
                  ...img,
                  url: urlData.publicUrl
                };
              })
            );
          }
        }

        const html = generateLatexContent(content, images);
        setPreviewHtml(html);
      } catch (error) {
        console.error('Error generating preview:', error);
        toast({
          title: "Erro na previsão",
          description: "Não foi possível gerar a previsão do banner",
          variant: "destructive",
          duration: 3000,
        });
      }
    };

    generatePreview();
  }, [content, workId, user, toast]);

  return (
    <Card className="w-full h-full bg-white overflow-auto">
      <BannerPreviewContent 
        previewHtml={previewHtml} 
        columnLayout={content.columnLayout || '2'}
        institutionLogo={content.institutionLogo}
        institutionName={content.institution}
        logoConfig={content.logoConfig}
        editable={true}
        onLogoConfigChange={onLogoConfigChange}
      />
    </Card>
  );
};

export default BannerPreview;