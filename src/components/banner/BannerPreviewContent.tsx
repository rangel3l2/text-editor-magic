import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useToast } from "@/components/ui/use-toast";

interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  const [sections, setSections] = useState<Array<{ id: string; content: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Parse the HTML string into sections
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, 'text/html');
    const sectionElements = doc.querySelectorAll('h3, p');
    
    const parsedSections = Array.from(sectionElements).map((element, index) => ({
      id: `section-${index}`,
      content: element.outerHTML
    }));
    
    setSections(parsedSections);
  }, [previewHtml]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSections(items);
    
    toast({
      title: "Seção movida",
      description: "A ordem das seções foi atualizada com sucesso",
      duration: 2000,
    });
  };

  return (
    <div className="w-full h-full overflow-auto p-4 flex items-start justify-center bg-gray-100">
      <div 
        className="w-[210mm] min-h-[297mm] bg-white shadow-lg"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="banner-sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="w-full h-full p-8"
                style={{
                  fontFamily: 'Times New Roman, serif',
                  fontSize: '12pt',
                  lineHeight: 1.5,
                  textAlign: 'justify',
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--background)',
                }}
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="cursor-move hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors p-2 rounded"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default BannerPreviewContent;