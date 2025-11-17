import { useEffect, useState } from 'react';
import { ImageConfig } from './ImageCropDialog';
import PreviewHeader from './preview/PreviewHeader';
import PreviewColumns from './preview/PreviewColumns';
import ImageSettings from './preview/ImageSettings';
import BannerPreviewStyles from './preview/BannerPreviewStyles';
import TipTapBannerEditor from './editor/TipTapBannerEditor';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import type { LogoConfig } from './header/LogoUpload';

interface ImageSettingsConfig {
  [key: string]: ImageConfig;
}

interface BannerPreviewContentProps {
  previewHtml: string;
  columnLayout?: '2' | '3';
  institutionLogo?: string;
  institutionName?: string;
  logoConfig?: LogoConfig;
  editable?: boolean;
  onLogoConfigChange?: (config: LogoConfig) => void;
  onContentUpdate?: (html: string) => void;
}

const BannerPreviewContent = ({ 
  previewHtml, 
  columnLayout = '2', 
  institutionLogo, 
  institutionName, 
  logoConfig,
  editable = false,
  onLogoConfigChange,
  onContentUpdate
}: BannerPreviewContentProps) => {
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettingsConfig>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const parseSections = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sectionElements = Array.from(doc.querySelectorAll('.banner-section'));
    return sectionElements as HTMLElement[];
  };

  useEffect(() => {
    if (previewHtml) {
      setSections(parseSections(previewHtml));
    }
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
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDialogOpen(true);
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  const handleSaveFromEditor = (html: string) => {
    if (onContentUpdate) {
      onContentUpdate(html);
    }
    setIsEditorOpen(false);
  };

  const getImageStyle = (imageUrl: string) => {
    const settings = imageSettings[imageUrl];

    const style: React.CSSProperties = {
      maxWidth: '100%',
      height: 'auto',
      objectFit: 'contain',
    };

    if (!settings) return style;

    const transforms: string[] = [];

    if (settings.crop) {
      // Translate image so that the selected crop area appears within the wrapper
      transforms.push(`translate(${-settings.crop.x}px, ${-settings.crop.y}px)`);
    }

    if (typeof settings.scale === 'number') {
      transforms.push(`scale(${settings.scale})`);
    }

    if (typeof settings.rotation === 'number') {
      transforms.push(`rotate(${settings.rotation}deg)`);
    }

    if (transforms.length) {
      style.transform = transforms.join(' ');
      style.transition = 'transform 0.2s';
      style.willChange = 'transform';
      // When cropping, alignment floats are handled on the wrapper, not the image
    }

    if (!settings.crop) {
      // Only apply alignment on the image when not using crop wrapper
      if (settings.alignment === 'left') {
        style.float = 'left';
        style.marginRight = '1rem';
        style.maxWidth = '60%';
      } else if (settings.alignment === 'right') {
        style.float = 'right';
        style.marginLeft = '1rem';
        style.maxWidth = '60%';
      } else {
        style.display = 'block';
        style.margin = '1rem auto';
        style.maxWidth = '90%';
      }
    }

    return style;
  };

  const getImageWrapperStyle = (imageUrl: string) => {
    const settings = imageSettings[imageUrl];
    if (!settings || !settings.crop) return null;

    const wrapper: React.CSSProperties = {
      width: `${settings.crop.width}px`,
      height: `${settings.crop.height}px`,
      overflow: 'hidden',
      display: 'inline-block',
    };

    if (settings.alignment === 'left') {
      wrapper.float = 'left';
      // Provide spacing consistent with previous image alignment
      (wrapper as any).marginRight = '1rem';
      (wrapper as any).maxWidth = '60%';
    } else if (settings.alignment === 'right') {
      wrapper.float = 'right';
      (wrapper as any).marginLeft = '1rem';
      (wrapper as any).maxWidth = '60%';
    } else {
      wrapper.display = 'block';
      (wrapper as any).margin = '1rem auto';
      (wrapper as any).maxWidth = '90%';
    }

    return wrapper;
  };

  if (!previewHtml) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(previewHtml, 'text/html');
  
  const headerSection = doc.querySelector('.banner-header');
  const extractedInstitutionName = headerSection?.querySelector('.institution')?.innerHTML || institutionName || '';
  const extractedInstitutionLogo = institutionLogo || '';
  const title = doc.querySelector('h1')?.innerHTML || '';
  const authors = doc.querySelector('.authors')?.innerHTML || '';

  return (
    <>
      <div className="w-full h-full overflow-auto p-4 flex flex-col items-center justify-start bg-gray-100">
        {editable && (
          <div className="mb-4">
            <Button onClick={handleOpenEditor} variant="default">
              <Edit className="w-4 h-4 mr-2" />
              Editar Banner
            </Button>
          </div>
        )}
        
        <div 
          className="bg-white shadow-lg"
          style={{
            width: '90cm',
            height: '120cm',
            padding: '2cm',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            margin: '0 auto',
            transform: 'scale(0.6)',
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
        <div className="banner-content flex-1 overflow-hidden">
          <PreviewHeader 
            institutionName={extractedInstitutionName}
            institutionLogo={extractedInstitutionLogo}
            logoConfig={logoConfig}
            title={title}
            authors={authors}
            editable={editable}
            onLogoConfigChange={onLogoConfigChange}
          />

          {/* Conteúdo em colunas começa após o cabeçalho */}
          <div style={{ marginTop: '1.5rem' }}>
            <PreviewColumns
              sections={sections}
              draggedSection={draggedSection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              getImageStyle={getImageStyle}
              getImageWrapperStyle={getImageWrapperStyle}
              onImageClick={handleImageClick}
              columnLayout={columnLayout}
            />
          </div>
        </div>
      </div>

        <ImageSettings
          selectedImage={selectedImage}
          isImageDialogOpen={isImageDialogOpen}
          setIsImageDialogOpen={setIsImageDialogOpen}
          imageSettings={imageSettings}
          setImageSettings={setImageSettings}
        />

        <BannerPreviewStyles />
      </div>

      {isEditorOpen && (
        <TipTapBannerEditor
          initialContent={previewHtml}
          columnLayout={columnLayout}
          onSave={handleSaveFromEditor}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </>
  );
};

export default BannerPreviewContent;
