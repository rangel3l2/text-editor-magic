import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useValidationContext } from '@/contexts/ValidationContext';
import { useAISettings } from '@/hooks/useAISettings';

const ValidationToggleButton = () => {
  const { isValidationVisible, toggleValidation } = useValidationContext();
  const { aiEnabled, isLoading } = useAISettings();

  // Don't render if AI is disabled or still loading
  if (isLoading || !aiEnabled) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleValidation}
      className="gap-2"
    >
      {isValidationVisible ? (
        <>
          <EyeOff className="h-4 w-4" />
          Esconder Validações
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Mostrar Validações
        </>
      )}
    </Button>
  );
};

export default ValidationToggleButton;
