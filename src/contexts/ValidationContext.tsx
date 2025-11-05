import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ValidationContextType {
  isValidationVisible: boolean;
  toggleValidation: () => void;
  showValidation: () => void;
  hideValidation: () => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export const ValidationProvider = ({ children }: { children: ReactNode }) => {
  const [isValidationVisible, setIsValidationVisible] = useState(true);

  const toggleValidation = () => {
    setIsValidationVisible(prev => !prev);
  };

  const showValidation = () => {
    setIsValidationVisible(true);
  };

  const hideValidation = () => {
    setIsValidationVisible(false);
  };

  return (
    <ValidationContext.Provider value={{ 
      isValidationVisible, 
      toggleValidation,
      showValidation,
      hideValidation
    }}>
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidationContext = () => {
  const context = useContext(ValidationContext);
  if (context === undefined) {
    throw new Error('useValidationContext must be used within a ValidationProvider');
  }
  return context;
};
