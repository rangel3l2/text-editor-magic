import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useToast } from "@/components/ui/use-toast";

interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  const { toast } = useToast();
  const [sections, setSections] = useState<Array<{ id: string; content: string }>>([]);

  useEffect(() => {
    if (previewHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(previewHtml, 'text/html');
      const sectionElements = Array.from(doc.body.children);
      const newSections = sectionElements.map((section, index) => ({
        id: `section-${index}`,
        content: section.outerHTML
      }));
      setSections(newSections);
    }
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
    <div className="w-full h-full overflow-auto p-4 flex items-start justify-center bg-gray-100 dark:bg-gray-900">
      <div 
        className="w-[210mm] min-h-[297mm] bg-white dark:bg-gray-800 shadow-lg"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
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
                  color: 'inherit',
                }}
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`mb-4 p-2 rounded ${snapshot.isDragging ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
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