
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
  currentSection?: string;
}

const ValidationFeedback = ({ validationResult, isValidating, currentSection }: ValidationFeedbackProps) => {
  if (isValidating) {
    return (
      <Alert>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Validando {currentSection || 'conteúdo'}...</AlertTitle>
        </div>
        <AlertDescription>
          Aguarde enquanto analisamos o texto.
        </AlertDescription>
      </Alert>
    );
  }

  if (!validationResult) return null;
  
  // Verificar se há erro na resposta
  if (validationResult.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro na validação</AlertTitle>
        <AlertDescription>
          {validationResult.error || "Não foi possível validar o conteúdo. Tente novamente mais tarde."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant={validationResult.isValid ? "default" : "destructive"}>
        {validationResult.isValid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {validationResult.isValid ? "Conteúdo adequado" : "Atenção: problemas encontrados"}
        </AlertTitle>
        <AlertDescription>
          {validationResult.overallFeedback || "Avaliação concluída."}
        </AlertDescription>
      </Alert>

      {!validationResult.isValid && (
        <div className="space-y-2">
          {validationResult.redundancyIssues?.length > 0 && (
            <div>
              <h4 className="font-semibold">Problemas de redundância:</h4>
              <ul className="list-disc pl-5">
                {validationResult.redundancyIssues.map((issue: string, index: number) => (
                  <li key={`redundancy-${index}`} className="text-sm text-gray-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.contextIssues?.length > 0 && (
            <div>
              <h4 className="font-semibold">Problemas de contextualização:</h4>
              <ul className="list-disc pl-5">
                {validationResult.contextIssues.map((issue: string, index: number) => (
                  <li key={`context-${index}`} className="text-sm text-gray-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.grammarErrors?.length > 0 && (
            <div>
              <h4 className="font-semibold">Erros gramaticais:</h4>
              <ul className="list-disc pl-5">
                {validationResult.grammarErrors.map((error: string, index: number) => (
                  <li key={`grammar-${index}`} className="text-sm text-gray-600">{error}</li>
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
          
          {validationResult.details?.suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold">Sugestões de melhoria:</h4>
              <ul className="list-disc pl-5">
                {validationResult.details.suggestions.map((suggestion: string, index: number) => (
                  <li key={`detail-suggestion-${index}`} className="text-sm text-gray-600">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationFeedback;
