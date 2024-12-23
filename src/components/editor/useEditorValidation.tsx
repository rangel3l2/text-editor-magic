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
  const retryAttemptsRef = useRef<number>(0);
  const MAX_RETRY_ATTEMPTS = 3;
  const MIN_VALIDATION_INTERVAL = 30000; // 30 seconds between validations
  const RESULTS_SECTION_INTERVAL = 45000; // 45 seconds for Results section

  const getValidationInterval = useCallback(() => {
    // Longer interval for Results section to avoid rate limits
    return sectionName.toLowerCase().includes('resultados') ? 
      RESULTS_SECTION_INTERVAL : 
      MIN_VALIDATION_INTERVAL;
  }, [sectionName]);

  const validateContent = useCallback(async (content: string) => {
    if (!content?.trim()) {
      console.log('Empty content, skipping validation');
      return;
    }

    const now = Date.now();
    const validationInterval = getValidationInterval();
    
    if (now - lastValidationRef.current < validationInterval) {
      console.log('Validation throttled, waiting for cooldown');
      const remainingTime = Math.ceil((validationInterval - (now - lastValidationRef.current)) / 1000);
      
      // Only show toast if it's the Results section
      if (sectionName.toLowerCase().includes('resultados')) {
        toast({
          title: "Aguarde um momento",
          description: <ToastDescription message={`Para evitar sobrecarga, aguarde ${remainingTime} segundos antes de validar a seção de Resultados.`} />,
          duration: 5000,
        });
      }
      return;
    }

    try {
      setIsValidating(true);
      setCurrentSection(sectionName);
      console.log(`Validating section: ${sectionName}`);

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
        
        // Handle rate limit errors
        if (error.status === 429) {
          const retryAfter = 30; // Default 30 seconds if not specified
          retryAttemptsRef.current += 1;
          
          if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
            toast({
              title: "Limite de requisições atingido",
              description: <ToastDescription message={`Tentando novamente em ${retryAfter} segundos... (Tentativa ${retryAttemptsRef.current} de ${MAX_RETRY_ATTEMPTS})`} />,
              duration: 5000,
            });
            
            // Schedule retry
            setTimeout(() => {
              validateContent(content);
            }, retryAfter * 1000);
            return;
          } else {
            toast({
              title: "Limite de requisições excedido",
              description: <ToastDescription message="Por favor, aguarde alguns minutos antes de tentar novamente. O sistema está processando muitas requisições." />,
              variant: "destructive",
              duration: 5000,
            });
            retryAttemptsRef.current = 0;
            return;
          }
        }
        
        throw error;
      }

      setValidationResult(data);
      lastValidationRef.current = now;
      retryAttemptsRef.current = 0; // Reset retry counter on success

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
  }, [sectionName, toast, getValidationInterval]);

  const scheduleValidation = useCallback((content: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Longer delay for Results section
    const validationDelay = sectionName.toLowerCase().includes('resultados') ? 5000 : 3000;

    validationTimeoutRef.current = setTimeout(() => {
      validateContent(content);
    }, validationDelay);
  }, [validateContent, sectionName]);

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