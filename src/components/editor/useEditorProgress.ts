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

    if (percentage >= 90 && percentage < 100) {
      toast({
        title: "Atenção",
        description: "Você está próximo do limite de texto para esta seção",
        duration: 3000,
      });
    } else if (isOverLimit) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de texto para esta seção",
        variant: "destructive",
        duration: 3000,
      });
      return true;
    }

    return false;
  }, [maxLines, minLines, toast]);

  return {
    progress,
    currentLines,
    handleContentChange
  };
};