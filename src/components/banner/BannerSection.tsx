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
  getImageWrapperStyle: (imageUrl: string) => React.CSSProperties | null;
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
  getImageWrapperStyle,
  onImageClick
}: BannerSectionProps) => {
  const processedHtml = section.innerHTML.replace(
    /<img([^>]*)>/g,
    (match, attributes) => {
      const srcMatch = attributes.match(/src="([^"]*)"/);
      if (!srcMatch) return match;
      
      const imageUrl = srcMatch[1];
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

        return `<span style="${wrapperStyleString}" class="image-crop-wrapper cursor-pointer"><img${attributes} style="${imgStyleString}" class="hover:opacity-80 transition-opacity" data-image-url="${imageUrl}" /></span>`;
      }
      
      return `<img${attributes} style="${imgStyleString}" class="cursor-pointer hover:opacity-80 transition-opacity" data-image-url="${imageUrl}" />`;
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