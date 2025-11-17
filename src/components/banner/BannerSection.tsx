import React, { useState, useEffect, useRef } from 'react';
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

  const contentRef = useRef<HTMLDivElement>(null);
  const processedHtml = section.innerHTML;

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    imgs.forEach((img) => {
      const parent = img.parentElement as HTMLElement | null;
      if (!parent) return;
      if (!parent.classList.contains('attachment-container')) {
        const children = Array.from(parent.children);
        const imgIndex = children.indexOf(img);
        const hasBefore = imgIndex > 0 && children[imgIndex - 1].tagName === 'DIV';
        const hasAfter = imgIndex < children.length - 1 && children[imgIndex + 1].tagName === 'DIV';
        if (hasBefore && hasAfter) {
          parent.classList.add('attachment-container');
          parent.setAttribute(
            'data-attachment-id',
            img.getAttribute('data-attachment-id') ||
              img.getAttribute('data-image-id') ||
              img.getAttribute('data-image-url') ||
              img.getAttribute('src') ||
              ''
          );
          parent.setAttribute('draggable', 'true');
          (parent as HTMLElement).style.cursor = 'move';
        }
      }
    });
  }, [processedHtml]);

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
    
    const target = e.target as HTMLElement;
    const container = target.closest('.attachment-container') as HTMLElement | null;

    if (draggedImageId && sectionId) {
      let targetAttachmentId: string | null = null;

      if (container) {
        targetAttachmentId = container.getAttribute('data-attachment-id');
      } else if (contentRef.current) {
        // Sem alvo explícito: calcula posição pela coordenada Y do drop
        const y = (e as any).clientY ?? 0;
        const containers = Array.from(
          contentRef.current.querySelectorAll('.attachment-container')
        ) as HTMLElement[];

        // Encontra o primeiro container abaixo do ponto de drop
        const next = containers.find((el) => el.getBoundingClientRect().top > y);
        if (next) {
          targetAttachmentId = next.getAttribute('data-attachment-id');
        } else if (containers.length) {
          // Se não há próximo, vamos enviar para o final
          targetAttachmentId = '__END__';
        }
      }

      if (targetAttachmentId && targetAttachmentId !== draggedImageId) {
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
          ref={contentRef}
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