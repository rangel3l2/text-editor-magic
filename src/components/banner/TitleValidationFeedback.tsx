import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';

interface TitleValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
}

const TitleValidationFeedback = ({ validationResult, isValidating }: TitleValidationFeedbackProps) => {
  if (isValidating) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Validando título...</AlertTitle>
        <AlertDescription>
          Aguarde enquanto analisamos o título.
        </AlertDescription>
      </Alert>
    );
  }

  if (!validationResult) return null;

  return (
    <div className="space-y-4">
      <Alert variant={validationResult.isValid ? "default" : "destructive"}>
        {validationResult.isValid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {validationResult.isValid ? "Título adequado" : "Atenção: melhorias sugeridas"}
        </AlertTitle>
        <AlertDescription>
          {validationResult.feedback}
        </AlertDescription>
      </Alert>

      {!validationResult.isValid && (
        <div className="space-y-2">
          {validationResult.spellingErrors?.length > 0 && (
            <div>
              <h4 className="font-semibold">Erros ortográficos:</h4>
              <ul className="list-disc pl-5">
                {validationResult.spellingErrors.map((error: string, index: number) => (
                  <li key={`spelling-${index}`} className="text-sm text-gray-600">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.coherenceIssues?.length > 0 && (
            <div>
              <h4 className="font-semibold">Problemas de coerência:</h4>
              <ul className="list-disc pl-5">
                {validationResult.coherenceIssues.map((issue: string, index: number) => (
                  <li key={`coherence-${index}`} className="text-sm text-gray-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold">Sugestões de melhoria:</h4>
              <ul className="list-disc pl-5">
                {validationResult.suggestions.map((suggestion: string, index: number) => (
                  <li key={`suggestion-${index}`} className="text-sm text-gray-600">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.improvedVersions?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Versões sugeridas:
              </h4>
              <div className="grid gap-2">
                {validationResult.improvedVersions.map((version: string, index: number) => (
                  <Button
                    key={`version-${index}`}
                    variant="outline"
                    className="text-left h-auto py-2"
                    onClick={() => {
                      // You can implement this functionality later if needed
                      console.log('Selected version:', version);
                    }}
                  >
                    {version}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TitleValidationFeedback;