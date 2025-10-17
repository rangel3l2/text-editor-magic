
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ToastDescription } from './ToastDescription';
import { cleanHtmlTags } from '@/utils/latexProcessor';

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
  const RATE_LIMIT_BACKOFF = 45000; // 45 seconds wait after rate limit
  
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
      console.log('Validation rate limited, waiting for cooldown');
      return;
    }

    try {
      isValidatingRef.current = true;
      setIsValidating(true);
      setCurrentSection(sectionName);
      setErrorMessage(null);

      const prompts = [];
      if (sectionName.toLowerCase().includes('título')) {
        prompts.push({ type: 'title', sectionName });
      } else if (sectionName.toLowerCase().includes('docentes')) {
        prompts.push({ type: 'content', section: 'Docentes' });
      } else if (sectionName.toLowerCase().includes('discentes')) {
        prompts.push({ type: 'content', section: 'Discentes' });
      } else {
        prompts.push({ type: 'content', section: sectionName });
      }

      // Clean HTML tags from content before sending for validation
      const cleanedContent = cleanHtmlTags(content.trim());
      console.log(`Validating content for ${sectionName} with length ${cleanedContent.length}`);
      
      // Choose the right endpoint based on section type
      const functionEndpoint = sectionName.toLowerCase().includes('título') 
        ? 'validate-title' 
        : 'validate-content';
      
      console.log(`Using endpoint: ${functionEndpoint}`);
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke(functionEndpoint, {
        body: sectionName.toLowerCase().includes('título') 
          ? { 
              title: cleanedContent,
              sectionName
            }
          : { 
              content: cleanedContent,
              prompts,
              sectionName
            }
      });

      if (error) {
        console.error('Validation error:', error);
        
        // Extract additional information from error response if available
        let errorDetails = '';
        if (error.message) {
          errorDetails = error.message;
        } else if (typeof error === 'string') {
          errorDetails = error;
        } else if (error.toString) {
          errorDetails = error.toString();
        }
        
        // Check if it's a CORS or connection error
        const errorStr = errorDetails;
        if (errorStr.includes('CORS') || 
            errorStr.includes('Failed to fetch') || 
            errorStr.includes('Failed to send a request') ||
            errorStr.includes('Edge Function') ||
            errorStr.includes('status code 500') ||
            errorStr.includes('preflight request') ||
            errorStr.includes('blocked by CORS policy') ||
            errorStr.includes('net::ERR_FAILED')) {
          
          setErrorMessage(`Connection error: The virtual advisor is temporarily unavailable.`);
          
          // More detailed error logging
          console.error('CORS or connection error details:', {
            errorMessage: errorStr,
            errorObject: error,
            requestDetails: {
              content: cleanedContent.substring(0, 100) + '...',
              prompts,
              sectionName
            }
          });
          
          // Show toast for first error only
          if (retryAttemptsRef.current === 0) {
            toast({
              title: "Erro de conexão",
              description: <ToastDescription message="Não foi possível conectar ao orientador virtual. Você pode continuar trabalhando normalmente." />,
              variant: "destructive",
              duration: 10000,
            });
          }
          
          // Check if it's an error during function deployment
          if (errorStr.includes('Edge Function') && errorStr.includes('in progress')) {
            console.log('Edge function is still being deployed, waiting...');
            
            if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
              retryAttemptsRef.current++;
              setTimeout(() => {
                validateContent(content);
              }, 15000 * retryAttemptsRef.current); // 15 seconds x attempt number
              return;
            }
          }
          
          // Don't retry for persistent CORS errors after 3 attempts
          if ((errorStr.includes('CORS') || errorStr.includes('preflight')) && 
              retryAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
            console.log('Persistent CORS error, not retrying');
            throw new Error(`Persistent CORS error: ${errorStr}`);
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

      // Não exibe toast pois o feedback visual será mostrado no FeedbackPanel
    } catch (error) {
      console.error('Error validating content:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMessage);
      
      // Show toast only once for persistent errors
      if (retryAttemptsRef.current <= 1) {
        toast({
          title: "Virtual advisor unavailable",
          description: <ToastDescription message="The virtual advisor is temporarily unavailable. You can continue working normally." />,
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

    // Increase debounce time to reduce API calls
    validationTimeoutRef.current = setTimeout(() => {
      validateContent(content);
    }, 5000); // Increased from 3000 to 5000ms
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
