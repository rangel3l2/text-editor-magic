import React, { createContext, useContext } from 'react';
import { useManualValidation } from '@/hooks/useManualValidation';

interface ManualValidationContextType {
  markFieldFocused: (sectionName: string) => void;
  markFieldValidated: (sectionName: string) => void;
  isFirstField: (sectionName: string) => boolean;
  hasBeenFocused: (sectionName: string) => boolean;
  isValidated: (sectionName: string) => boolean;
  shouldShowValidationButton: (sectionName: string) => boolean;
  shouldAutoValidate: (sectionName: string) => boolean;
  resetValidation: () => void;
}

const ManualValidationContext = createContext<ManualValidationContextType | undefined>(undefined);

export const ManualValidationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const validation = useManualValidation();
  
  return (
    <ManualValidationContext.Provider value={validation}>
      {children}
    </ManualValidationContext.Provider>
  );
};

export const useManualValidationContext = () => {
  const context = useContext(ManualValidationContext);
  if (!context) {
    throw new Error('useManualValidationContext must be used within ManualValidationProvider');
  }
  return context;
};
