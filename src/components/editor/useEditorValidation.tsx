
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ToastDescription } from './ToastDescription';

export const useEditorValidation = (sectionName: string) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string>('');
  const { toast } = useToast();
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValidationRef = useRef<number>(0);
  const retryAttemptsRef = useRef<number>(0);
  const isValidatingRef = useRef(false);
  const MAX_RETRY_ATTEMPTS = 3;
  const MIN_VALIDATION_INTERVAL = 30000; // 30 seconds between validations
  const RESULTS_SECTION_INTERVAL = 60000; // 1 minute for Results section
  const RATE_LIMIT_BACKOFF = 45000; // 45 seconds backoff after rate limit

  const getValidationInterval = useCallback(() => {
    const isResultsSection = sectionName.toLowerCase().includes('resultados') || 
                           sectionName.toLowerCase().includes('discussão');
    return isResultsSection ? RESULTS_SECTION_INTERVAL : MIN_VALIDATION_INTERVAL;
  }, [sectionName]);

  const validateContent = useCallback(async (content: string) => {
    if (!content?.trim() || isValidatingRef.current) {
      console.log('Skipping validation - empty content or already validating');
      return;
    }

    const now = Date.now();
    const validationInterval = getValidationInterval();
    const timeSinceLastValidation = now - lastValidationRef.current;
    
    if (timeSinceLastValidation < validationInterval) {
      console.log('Validation throttled, waiting for cooldown');
      return;
    }

    try {
      isValidatingRef.current = true;
      setIsValidating(true);
      setCurrentSection(sectionName);
      setErrorMessage(null);

      const prompts = [];
      if (sectionName.toLowerCase().includes('título')) {
        prompts.push({ type: 'title' });
      } else {
        prompts.push({ type: 'content', section: sectionName });
      }

      console.log(`Validating ${sectionName} content with length ${content.length}`);
      
      const { data, error } = await supabase.functions.invoke('validate-content', {
        body: { 
          content: content.trim(),
          prompts
        }
      });

      if (error) {
        console.error('Validation error:', error);
        
        // Verificar se é erro de CORS ou conexão
        const errorStr = error.toString();
        if (errorStr.includes('CORS') || 
            errorStr.includes('Failed to fetch') || 
            errorStr.includes('Failed to send a request') ||
            errorStr.includes('Edge Function')) {
          
          setErrorMessage(`Erro de conexão: ${errorStr}`);
          
          // Não tenta retry para erros de CORS - isso só geraria mais erros
          if (errorStr.includes('CORS')) {
            console.log('CORS error detected, not retrying');
            throw new Error(`Erro de CORS detectado: ${errorStr}`);
          }
        } else {
          setErrorMessage(errorStr);
        }
        
        if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
          retryAttemptsRef.current++;
          const backoffTime = RATE_LIMIT_BACKOFF * retryAttemptsRef.current;
          console.log(`Retrying validation in ${backoffTime/1000} seconds (attempt ${retryAttemptsRef.current})`);
          
          setTimeout(() => {
            validateContent(content);
          }, backoffTime);
          return;
        }
        
        throw error;
      }

      setValidationResult(data);
      setErrorMessage(null);
      lastValidationRef.current = now;
      retryAttemptsRef.current = 0;

      if (!data.isValid) {
        toast({
          title: `Validação da seção: ${sectionName}`,
          description: <ToastDescription message={data.overallFeedback} />,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error validating content:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMessage);
      
      // Só mostra toast para erros não relacionados à CORS/conexão
      if (!errorMessage.includes('CORS') && !errorMessage.includes('Failed to fetch')) {
        toast({
          title: "Erro na validação",
          description: <ToastDescription message="Não foi possível validar o conteúdo. Você pode continuar trabalhando normalmente." />,
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      isValidatingRef.current = false;
      setIsValidating(false);
      setCurrentSection('');
    }
  }, [sectionName, toast, getValidationInterval]);

  const scheduleValidation = useCallback((content: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      validateContent(content);
    }, 3000);
  }, [validateContent]);

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
    errorMessage,
    validateContent,
    scheduleValidation,
    currentSection
  };
};
