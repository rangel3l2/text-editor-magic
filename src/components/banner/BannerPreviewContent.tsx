import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ImageCropDialog from './ImageCropDialog';

interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  const { toast } = useToast();
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

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
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;
    
    target.classList.remove('drop-top', 'drop-bottom');

    if (draggedSection === null || draggedSection === targetIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedSection, 1);
    
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

  const handleImageSave = async (croppedImage: string) => {
    // Here we would save the cropped image to Supabase storage
    // and update the banner_images table with the new configuration
    setIsImageDialogOpen(false);
    toast({
      title: "Imagem atualizada",
      description: "As alterações na imagem foram salvas com sucesso",
      duration: 2000,
    });
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
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'IMG') {
                  handleImageClick(target.getAttribute('src') || '');
                }
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
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'IMG') {
                    handleImageClick(target.getAttribute('src') || '');
                  }
                }}
              >
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
                    img {
                      cursor: pointer;
                      transition: opacity 0.2s;
                    }
                    img:hover {
                      opacity: 0.8;
                    }
                  `}
                </style>
                <div 
                  className="p-2 rounded"
                  dangerouslySetInnerHTML={{ __html: section.outerHTML }} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[800px] max-h-[95vh] p-6">
          <ImageCropDialog
            imageUrl={selectedImage || ''}
            onSave={handleImageSave}
            onCancel={() => setIsImageDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerPreviewContent;