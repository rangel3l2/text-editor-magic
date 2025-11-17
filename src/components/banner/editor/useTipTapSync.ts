import { useState, useCallback } from 'react';

interface UseTipTapSyncProps {
  content: any;
  onContentUpdate: (field: string, value: string) => void;
}

export const useTipTapSync = ({ content, onContentUpdate }: UseTipTapSyncProps) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');

  const openEditor = useCallback((previewHtml: string) => {
    setEditorContent(previewHtml);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  const saveFromEditor = useCallback((html: string) => {
    // Parse o HTML editado e extrai as seções de volta
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Mapeia as seções do HTML para os campos do conteúdo
    const sections = Array.from(doc.querySelectorAll('.banner-section'));
    
    sections.forEach((section) => {
      const sectionId = section.getAttribute('data-section-id');
      const sectionContent = section.innerHTML;
      
      if (sectionId && content.hasOwnProperty(sectionId)) {
        onContentUpdate(sectionId, sectionContent);
      }
    });

    setIsEditorOpen(false);
  }, [content, onContentUpdate]);

  return {
    isEditorOpen,
    editorContent,
    openEditor,
    closeEditor,
    saveFromEditor,
  };
};
