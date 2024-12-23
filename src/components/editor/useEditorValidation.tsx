import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ToastDescription } from './ToastDescription';

export const useEditorValidation = (sectionName: string) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');
  const { toast } = useToast();
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValidationRef = useRef<number>(0);
  const MIN_VALIDATION_INTERVAL = 30000; // 30 seconds between validations

  const validateContent = useCallback(async (content: string) => {
    if (!content?.trim()) {
      console.log('Empty content, skipping validation');
      return;
    }

    const now = Date.now();
    if (now - lastValidationRef.current < MIN_VALIDATION_INTERVAL) {
      console.log('Validation throttled, waiting for cooldown');
      const remainingTime = Math.ceil((MIN_VALIDATION_INTERVAL - (now - lastValidationRef.current)) / 1000);
      toast({
        title: "Aguarde um momento",
        description: <ToastDescription message={`Por favor, aguarde ${remainingTime} segundos antes de tentar validar novamente.`} />,
        duration: 3000,
      });
      return;
    }

    try {
      setIsValidating(true);
      setCurrentSection(sectionName);
      console.log(`Validating section: ${sectionName}`);

      // Determine prompt type based on section name
      const prompts = [];
      if (sectionName.toLowerCase().includes('título')) {
        prompts.push({ type: 'title' });
      } else {
        prompts.push({ type: 'content', section: sectionName });
      }

      const { data, error } = await supabase.functions.invoke('validate-content', {
        body: { 
          content: content.trim(),
          prompts
        }
      });

      if (error) {
        console.error('Error in validation:', error);
        
        // Handle rate limit errors specifically
        if (error.status === 429) {
          toast({
            title: "Limite de requisições excedido",
            description: <ToastDescription message="Por favor, aguarde alguns minutos antes de tentar novamente. O sistema está processando muitas requisições." />,
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
        
        throw error;
      }

      setValidationResult(data);
      lastValidationRef.current = now;

      if (!data.isValid) {
        toast({
          title: `Validação da seção: ${sectionName}`,
          description: <ToastDescription message={data.overallFeedback} />,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error validating content:', error);
      toast({
        title: "Erro na validação",
        description: <ToastDescription message="Não foi possível validar o conteúdo. Tente novamente em alguns instantes." />,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
      setCurrentSection('');
    }
  }, [sectionName, toast]);

  const scheduleValidation = useCallback((content: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      validateContent(content);
    }, 3000); // Increased debounce to 3 seconds
  }, [validateContent]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return {
    validationResult,
    isValidating,
    validateContent,
    scheduleValidation,
    currentSection
  };
};