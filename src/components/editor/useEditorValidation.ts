import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useEditorValidation = (sectionName: string) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<any>(null);
  const { toast } = useToast();

  const validateContent = useCallback(async (content: string) => {
    if (!content.trim() || !sectionName) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-content', {
        body: { content, section: sectionName },
        method: 'POST'
      });

      if (error) throw error;

      setValidationResult(data);

      if (!data.isValid) {
        toast({
          title: "Problemas encontrados no conteúdo",
          description: "Verifique as sugestões de melhoria abaixo do editor.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Conteúdo validado com sucesso",
          description: "O texto está adequado para esta seção.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error validating content:', error);
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o conteúdo. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
    }
  }, [sectionName, toast]);

  const scheduleValidation = useCallback((content: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    validationTimeoutRef.current = setTimeout(() => {
      validateContent(content);
    }, 2000);
  }, [validateContent]);

  return {
    validationResult,
    isValidating,
    validateContent,
    scheduleValidation
  };
};