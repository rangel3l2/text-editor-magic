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

  const processedHtml = section.innerHTML;

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const imageUrl = target.getAttribute('data-image-url') || target.getAttribute('src');
      if (imageUrl) {
        onImageClick(imageUrl);
      }
    }
  };

  const handleImageDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    // Procura o container arrastável mais próximo
    const container = target.closest('.attachment-container');
    if (container) {
      const attachmentId = container.getAttribute('data-attachment-id');
      if (attachmentId) {
        setDraggedImageId(attachmentId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', attachmentId);
        (container as HTMLElement).style.opacity = '0.5';
      }
    }
  };

  const handleImageDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const container = target.closest('.attachment-container');
    if (container) {
      (container as HTMLElement).style.opacity = '1';
      setDraggedImageId(null);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const container = target.closest('.attachment-container');
    if (container && draggedImageId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    const container = target.closest('.attachment-container');
    if (container && draggedImageId && sectionId) {
      const targetAttachmentId = container.getAttribute('data-attachment-id');
      if (targetAttachmentId && targetAttachmentId !== draggedImageId) {
        // Dispatch evento para reordenar imagens inline
        const event = new CustomEvent('reorderAttachmentInline', {
          detail: {
            sectionId,
            sourceId: draggedImageId,
            targetId: targetAttachmentId
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
      onDragStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.attachment-container')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onDragStart(index);
      }}
      onDragOver={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.attachment-container')) {
          // Deixe o gerenciamento para o handler interno de imagens
          return;
        }
        onDragOver(e);
      }}
      onDragLeave={(e) => onDragLeave(e)}
      onDrop={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.attachment-container')) {
          // Drop tratado internamente para imagens
          return;
        }
        onDrop(e, index);
      }}
      className="banner-section relative transition-colors break-inside-avoid-column mb-4"
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