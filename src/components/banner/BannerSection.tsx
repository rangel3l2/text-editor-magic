import React from 'react';

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
                
                return `<img${attributes} style="${styleString}" class="cursor-pointer hover:opacity-80 transition-opacity" />`;
              }
            )
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              onImageClick(target.getAttribute('src') || '');
            }
          }}
        />
      </div>
    </div>
  );
};

export default BannerSection;