import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  const { toast } = useToast();
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [draggedSection, setDraggedSection] = useState<number | null>(null);

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
    e.currentTarget.classList.add('bg-gray-100');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-gray-100');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');

    if (draggedSection === null || draggedSection === targetIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedSection, 1);
    newSections.splice(targetIndex, 0, movedSection);

    setSections(newSections);
    setDraggedSection(null);

    toast({
      title: "Seção movida",
      description: "A ordem das seções foi atualizada com sucesso",
      duration: 2000,
    });
  };

  return (
    <div className="w-full h-full overflow-auto p-4 flex items-start justify-center bg-gray-100">
      <div 
        className="bg-white shadow-lg"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          margin: '0 auto',
          transform: 'scale(0.9)',
          transformOrigin: 'top center',
        }}
      >
        <div className="banner-content">
          {/* Header Section - Not draggable */}
          <div className="text-center mb-8">
            <div dangerouslySetInnerHTML={{ 
              __html: previewHtml.split('<div class="banner-section"')[0] 
            }} />
          </div>

          {/* Draggable Content Sections */}
          <div className="grid grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className="banner-section cursor-move hover:bg-gray-50 transition-colors p-2 rounded"
                style={{
                  fontFamily: 'Times New Roman, serif',
                  fontSize: '12pt',
                  lineHeight: 1.5,
                  textAlign: 'justify',
                  color: '#000000',
                }}
                dangerouslySetInnerHTML={{ __html: section.outerHTML }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerPreviewContent;