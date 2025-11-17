import React, { useState } from 'react';
import { sanitizeHtml } from '@/utils/sanitize';

interface BannerSectionProps {
  section: HTMLElement;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  getImageStyle: (imageUrl: string) => React.CSSProperties;
  getImageWrapperStyle: (imageUrl: string) => React.CSSProperties | null;
  onImageClick: (imageUrl: string) => void;
  sectionId?: string;
}

const BannerSection = ({
  section,
  index,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  getImageStyle,
  getImageWrapperStyle,
  onImageClick,
  sectionId
}: BannerSectionProps) => {
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const processedHtml = section.innerHTML.replace(
    /<img([^>]*)>/g,
    (match, attributes) => {
      const srcMatch = attributes.match(/src="([^"]*)"/);
      const imageIdMatch = attributes.match(/data-image-id="([^"]*)"/);
      if (!srcMatch) return match;
      
      const imageUrl = srcMatch[1];
      const imageId = imageIdMatch ? imageIdMatch[1] : '';
      const imgStyle = getImageStyle(imageUrl);
      const wrapperStyle = getImageWrapperStyle(imageUrl);

      const imgStyleString = Object.entries(imgStyle)
        .map(([key, value]) => {
          const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${kebabKey}:${value}`;
        })
        .join(';');

      if (wrapperStyle && Object.keys(wrapperStyle).length > 0) {
        const wrapperStyleString = Object.entries(wrapperStyle)
          .map(([key, value]) => {
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${kebabKey}:${value}`;
          })
          .join(';');

        return `<span style="${wrapperStyleString}" class="image-crop-wrapper cursor-move"><img${attributes} draggable="true" style="${imgStyleString}" class="hover:opacity-80 transition-opacity hover:ring-2 hover:ring-primary" data-image-url="${imageUrl}" data-image-id="${imageId}" /></span>`;
      }
      
      return `<img${attributes} draggable="true" style="${imgStyleString}" class="cursor-move hover:opacity-80 transition-opacity hover:ring-2 hover:ring-primary" data-image-url="${imageUrl}" data-image-id="${imageId}" />`;
    }
  );

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const imageUrl = target.getAttribute('data-image-url');
      if (imageUrl) {
        onImageClick(imageUrl);
      }
    }
  };

  const handleImageDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const imageId = target.getAttribute('data-image-id');
      if (imageId) {
        setDraggedImageId(imageId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', imageId);
        target.style.opacity = '0.5';
      }
    }
  };

  const handleImageDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      target.style.opacity = '1';
      setDraggedImageId(null);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && draggedImageId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && draggedImageId && sectionId) {
      const targetImageId = target.getAttribute('data-image-id');
      if (targetImageId && targetImageId !== draggedImageId) {
        // Dispatch evento para reordenar imagens inline
        const event = new CustomEvent('reorderAttachmentInline', {
          detail: {
            sectionId,
            sourceId: draggedImageId,
            targetId: targetImageId
          }
        });
        window.dispatchEvent(event);
      }
    }
    setDraggedImageId(null);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
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
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedHtml) }}
          onClick={handleClick}
          onDragStart={handleImageDragStart}
          onDragEnd={handleImageDragEnd}
          onDragOver={handleImageDragOver}
          onDrop={handleImageDrop}
        />
      </div>
    </div>
  );
};

export default BannerSection;