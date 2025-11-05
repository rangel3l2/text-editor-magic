import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { calculateTextProgress } from '@/utils/textProgress';

export const useEditorProgress = (maxLines: number, minLines: number) => {
  const [progress, setProgress] = useState(0);
  const [currentLines, setCurrentLines] = useState(0);
  const { toast } = useToast();

  const handleContentChange = useCallback((data: string) => {
    const { percentage, actualLines, isOverLimit } = calculateTextProgress(data, maxLines, minLines);
    
    setProgress(percentage);
    setCurrentLines(actualLines);

    // Apenas alerta quando ultrapassa muito o limite (150%), sem bloquear
    if (percentage >= 150) {
      toast({
        title: "Texto muito longo",
        description: "Esta seção está muito extensa. Considere revisar o conteúdo para manter a objetividade acadêmica.",
        duration: 5000,
      });
    }

    return false; // Nunca bloqueia
  }, [maxLines, minLines, toast]);

  return {
    progress,
    currentLines,
    handleContentChange
  };
};