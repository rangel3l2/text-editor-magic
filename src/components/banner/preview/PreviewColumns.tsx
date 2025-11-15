import BannerSection from '../BannerSection';
import { ImageConfig } from '../ImageCropDialog';

interface PreviewColumnsProps {
  sections: HTMLElement[];
  draggedSection: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  getImageStyle: (imageUrl: string) => React.CSSProperties;
  onImageClick: (imageUrl: string) => void;
  columnLayout?: '2' | '3';
}

const PreviewColumns = ({
  sections,
  draggedSection,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  getImageStyle,
  onImageClick,
  columnLayout = '2'
}: PreviewColumnsProps) => {
  const columnClass = columnLayout === '3' ? 'columns-3' : 'columns-2';
  
  return (
    <div className={`${columnClass} gap-8 h-full`} style={{ columnGap: '3rem' }}>
      {sections.map((section, index) => (
        <BannerSection
          key={index}
          section={section}
          index={index}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          getImageStyle={getImageStyle}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  );
};

export default PreviewColumns;