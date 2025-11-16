import React from 'react';
import { sanitizeHtml } from '@/utils/sanitize';

interface BannerSectionProps {
  section: HTMLElement;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  getImageStyle: (imageUrl: string) => React.CSSProperties;
  onImageClick: (imageUrl: string) => void;
}

const BannerSection = ({
  section,
  index,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  getImageStyle,
  onImageClick
}: BannerSectionProps) => {
  const processedHtml = section.innerHTML.replace(
    /<img([^>]*)>/g,
    (match, attributes) => {
      const srcMatch = attributes.match(/src="([^"]*)"/);
      if (!srcMatch) return match;
      
      const imageUrl = srcMatch[1];
      const style = getImageStyle(imageUrl);
      const styleString = Object.entries(style)
        .map(([key, value]) => {
          const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${kebabKey}:${value}`;
        })
        .join(';');
      
      return `<img${attributes} style="${styleString}" class="cursor-pointer hover:opacity-80 transition-opacity" data-image-url="${imageUrl}" />`;
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
        />
      </div>
    </div>
  );
};

export default BannerSection;