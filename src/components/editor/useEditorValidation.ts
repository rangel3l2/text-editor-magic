import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useEditorValidation = (sectionName: string) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<any>(null);
  const lastValidationRef = useRef<number>(0);
  const { toast } = useToast();

  const validateContent = useCallback(async (content: string) => {
    if (!content.trim() || !sectionName) return;
    
    // Prevent validation if less than 5 seconds have passed since last validation
    const now = Date.now();
    if (now - lastValidationRef.current < 5000) {
      console.log('Skipping validation - too soon since last validation');
      return;
    }
    
    setIsValidating(true);
    try {
      console.log(`Validating content for section: ${sectionName}`);
      const { data, error } = await supabase.functions.invoke('validate-content', {
        body: { content, section: sectionName },
        method: 'POST'
      });

      if (error) {
        console.error('Error validating content:', error);
        throw error;
      }

      setValidationResult(data);
      lastValidationRef.current = now;

      if (!data.isValid) {
        toast({
          title: "Sugestões de melhoria",
          description: "Verifique as sugestões abaixo do editor.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Conteúdo validado",
          description: "O texto está adequado para esta seção.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error in validation:', error);
      
      // Check if it's a rate limit error
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        toast({
          title: "Limite de requisições excedido",
          description: "Por favor, aguarde alguns minutos antes de tentar novamente.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Erro na validação",
          description: "Não foi possível validar o texto. Tente novamente em alguns instantes.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } finally {
      setIsValidating(false);
    }
  }, [sectionName, toast]);

  const scheduleValidation = useCallback((content: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Increase debounce time to 2 seconds to reduce API calls
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