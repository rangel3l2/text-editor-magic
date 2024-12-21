import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ToastDescription } from './ToastDescription';

export const useEditorValidation = (sectionName: string) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');
  const { toast } = useToast();

  let validationTimeout: NodeJS.Timeout;

  const validateContent = useCallback(async (content: string) => {
    if (!content?.trim()) {
      console.log('Empty content, skipping validation');
      return;
    }

    if (!sectionName?.trim()) {
      console.log('No section name provided, skipping validation');
      return;
    }

    try {
      setIsValidating(true);
      setCurrentSection(sectionName);

      console.log(`Validando seção: ${sectionName}`);
      const { data, error } = await supabase.functions.invoke('validate-content', {
        body: { 
          content: content.trim(),
          section: sectionName.trim()
        }
      });

      if (error) {
        console.error('Error in validation:', error);
        throw error;
      }

      setValidationResult(data);

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
        description: "Não foi possível validar o conteúdo. Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
      setCurrentSection('');
    }
  }, [sectionName, toast]);

  const scheduleValidation = useCallback((content: string) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    validationTimeout = setTimeout(() => {
      validateContent(content);
    }, 2000);
  }, [validateContent]);

  return {
    validationResult,
    isValidating,
    validateContent,
    scheduleValidation,
    currentSection
  };
};