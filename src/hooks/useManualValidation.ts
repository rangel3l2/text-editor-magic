import { useState, useCallback, useRef } from 'react';

interface ValidationState {
  [sectionName: string]: {
    isValidated: boolean;
    isFirstAccess: boolean;
    hasBeenFocused: boolean;
  };
}

export const useManualValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({});
  const firstFieldAccessedRef = useRef<string | null>(null);

  const markFieldFocused = useCallback((sectionName: string) => {
    setValidationState(prev => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        hasBeenFocused: true,
        isFirstAccess: !firstFieldAccessedRef.current,
      }
    }));

    // Marca o primeiro campo acessado
    if (!firstFieldAccessedRef.current) {
      firstFieldAccessedRef.current = sectionName;
    }
  }, []);

  const markFieldValidated = useCallback((sectionName: string) => {
    setValidationState(prev => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        isValidated: true,
      }
    }));
  }, []);

  const isFirstField = useCallback((sectionName: string) => {
    return firstFieldAccessedRef.current === sectionName;
  }, []);

  const hasBeenFocused = useCallback((sectionName: string) => {
    return validationState[sectionName]?.hasBeenFocused || false;
  }, [validationState]);

  const isValidated = useCallback((sectionName: string) => {
    return validationState[sectionName]?.isValidated || false;
  }, [validationState]);

  const shouldShowValidationButton = useCallback((sectionName: string) => {
    const field = validationState[sectionName];
    // Mostra botão se: já foi focado, não é o primeiro campo, e ainda não foi validado
    return field?.hasBeenFocused && !field?.isFirstAccess && !field?.isValidated;
  }, [validationState]);

  const shouldAutoValidate = useCallback((sectionName: string) => {
    // Auto-valida apenas o primeiro campo que o usuário focar
    return isFirstField(sectionName) && hasBeenFocused(sectionName) && !isValidated(sectionName);
  }, [isFirstField, hasBeenFocused, isValidated]);

  const resetValidation = useCallback(() => {
    setValidationState({});
    firstFieldAccessedRef.current = null;
  }, []);

  return {
    markFieldFocused,
    markFieldValidated,
    isFirstField,
    hasBeenFocused,
    isValidated,
    shouldShowValidationButton,
    shouldAutoValidate,
    resetValidation,
  };
};
