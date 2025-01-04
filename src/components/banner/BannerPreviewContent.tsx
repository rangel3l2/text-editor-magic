import { useEffect, useState } from 'react';
import { ImageConfig } from './ImageCropDialog';
import PreviewHeader from './preview/PreviewHeader';
import PreviewColumns from './preview/PreviewColumns';
import ImageSettings from './preview/ImageSettings';
import BannerPreviewStyles from './preview/BannerPreviewStyles';

interface BannerPreviewContentProps {
  previewHtml: string;
}

interface ImageSettings {
  [key: string]: ImageConfig;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
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

  if (!previewHtml) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(previewHtml, 'text/html');
  
  const headerSection = doc.querySelector('.banner-header');
  const institutionName = headerSection?.querySelector('.institution')?.innerHTML || '';
  const institutionLogo = headerSection?.querySelector('img[alt="Logo da Instituição"]')?.getAttribute('src') || '';
  const title = doc.querySelector('h1')?.innerHTML || '';
  const authors = doc.querySelector('.authors')?.innerHTML || '';

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
          <PreviewHeader 
            institutionName={institutionName}
            institutionLogo={institutionLogo}
            title={title}
            authors={authors}
          />

          <PreviewColumns
            sections={sections}
            draggedSection={draggedSection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            getImageStyle={getImageStyle}
            onImageClick={handleImageClick}
          />
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
  );
};

export default BannerPreviewContent;