import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ImageCropDialog, { ImageConfig } from './ImageCropDialog';
import { supabase } from "@/integrations/supabase/client";

interface BannerPreviewContentProps {
  previewHtml: string;
}

interface ImageSettings {
  [key: string]: ImageConfig;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  const { toast } = useToast();
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({});

  const parseSections = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sectionElements = Array.from(doc.querySelectorAll('.banner-section'));
    return sectionElements as HTMLElement[];
  };

  useEffect(() => {
    setSections(parseSections(previewHtml));
  }, [previewHtml]);

  const handleDragStart = (index: number) => {
    setDraggedSection(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;
    target.classList.remove('drop-top', 'drop-bottom');
    if (isTopHalf) {
      target.classList.add('drop-top');
    } else {
      target.classList.add('drop-bottom');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drop-top', 'drop-bottom');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drop-top', 'drop-bottom');

    if (draggedSection === null || draggedSection === targetIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedSection, 1);
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;
    const newPosition = isTopHalf ? targetIndex : targetIndex + 1;
    
    newSections.splice(newPosition, 0, movedSection);
    setSections(newSections);
    setDraggedSection(null);

    toast({
      title: "Seção movida",
      description: "A ordem das seções foi atualizada com sucesso",
      duration: 2000,
    });
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDialogOpen(true);
  };

  const handleImageSave = async (config: ImageConfig) => {
    if (!selectedImage) return;

    try {
      setImageSettings(prev => ({
        ...prev,
        [selectedImage]: config
      }));

      // Save to Supabase
      const { error } = await supabase
        .from('banner_images')
        .upsert({
          image_url: selectedImage,
          position_data: config
        });

      if (error) throw error;

      setIsImageDialogOpen(false);
      toast({
        title: "Imagem atualizada",
        description: "As alterações na imagem foram salvas com sucesso",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving image settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações da imagem",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getImageStyle = (imageUrl: string) => {
    const settings = imageSettings[imageUrl];
    if (!settings) return {};

    const style: React.CSSProperties = {
      transform: `scale(${settings.scale}) rotate(${settings.rotation}deg)`,
      transition: 'transform 0.2s',
    };

    if (settings.alignment === 'left') {
      style.float = 'left';
      style.marginRight = '1rem';
    } else if (settings.alignment === 'right') {
      style.float = 'right';
      style.marginLeft = '1rem';
    } else {
      style.display = 'block';
      style.margin = '0 auto';
    }

    return style;
  };

  return (
    <div className="w-full h-full overflow-auto p-4 flex items-start justify-center bg-gray-100">
      <div 
        className="bg-white shadow-lg"
        style={{
          width: '210mm',
          height: '297mm',
          padding: '15mm',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          margin: '0 auto',
          transform: 'scale(0.9)',
          transformOrigin: 'top center',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div className="banner-content flex-1 overflow-hidden">
          <div className="col-span-2 w-full mb-4">
            <div 
              className="text-center"
              dangerouslySetInnerHTML={{ 
                __html: previewHtml.split('<div class="banner-section"')[0] 
              }}
            />
          </div>

          <div className="columns-2 gap-4 h-full">
            {sections.map((section, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className="banner-section relative cursor-move transition-colors break-inside-avoid-column mb-4"
                style={{
                  fontFamily: 'Times New Roman, serif',
                  fontSize: '10pt',
                  lineHeight: '1.2',
                  textAlign: 'justify',
                  color: '#000000',
                }}
              >
                <div className="p-2 rounded">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: section.innerHTML.replace(
                        /<img([^>]*)>/g,
                        (match, attributes) => {
                          const srcMatch = attributes.match(/src="([^"]*)"/);
                          if (!srcMatch) return match;
                          
                          const imageUrl = srcMatch[1];
                          const style = getImageStyle(imageUrl);
                          const styleString = Object.entries(style)
                            .map(([key, value]) => `${key}:${value}`)
                            .join(';');
                          
                          return `<img${attributes} style="${styleString}" onclick="window.handleImageClick('${imageUrl}')" class="cursor-pointer hover:opacity-80 transition-opacity" />`;
                        }
                      )
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'IMG') {
                        handleImageClick(target.getAttribute('src') || '');
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[800px] max-h-[95vh] p-6">
          <ImageCropDialog
            imageUrl={selectedImage || ''}
            initialConfig={selectedImage ? imageSettings[selectedImage] : undefined}
            onSave={handleImageSave}
            onCancel={() => setIsImageDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <style>
        {`
          .banner-section:hover {
            background-color: transparent;
          }
          .banner-section:hover > div {
            background-color: rgb(243 244 246);
          }
          .banner-section.drop-top::before {
            content: '';
            position: absolute;
            top: -3px;
            left: 0;
            right: 0;
            height: 3px;
            background-color: #2563eb;
          }
          .banner-section.drop-bottom::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            right: 0;
            height: 3px;
            background-color: #2563eb;
          }
        `}
      </style>
    </div>
  );
};

export default BannerPreviewContent;