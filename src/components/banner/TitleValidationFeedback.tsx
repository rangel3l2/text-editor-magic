
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';

interface TitleValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
}

const TitleValidationFeedback = ({ validationResult, isValidating }: TitleValidationFeedbackProps) => {
  if (isValidating) {
    return (
      <Alert>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Validando título...</AlertTitle>
        </div>
        <AlertDescription>
          Aguarde enquanto analisamos o título.
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
          {validationResult.error || "Não foi possível validar o título. Tente novamente mais tarde."}
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
          {validationResult.isValid ? "Título adequado" : "Atenção: melhorias sugeridas"}
        </AlertTitle>
        <AlertDescription>
          {validationResult.overallFeedback || "Avaliação concluída."}
        </AlertDescription>
      </Alert>

      {!validationResult.isValid && validationResult.details && (
        <div className="space-y-2">
          {validationResult.details.spellingErrors?.length > 0 && (
            <div>
              <h4 className="font-semibold">Erros ortográficos:</h4>
              <ul className="list-disc pl-5">
                {validationResult.details.spellingErrors.map((error: string, index: number) => (
                  <li key={`spelling-${index}`} className="text-sm text-gray-600">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.details.coherenceIssues?.length > 0 && (
            <div>
              <h4 className="font-semibold">Problemas de coerência:</h4>
              <ul className="list-disc pl-5">
                {validationResult.details.coherenceIssues.map((issue: string, index: number) => (
                  <li key={`coherence-${index}`} className="text-sm text-gray-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.details.suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold">Sugestões de melhoria:</h4>
              <ul className="list-disc pl-5">
                {validationResult.details.suggestions.map((suggestion: string, index: number) => (
                  <li key={`suggestion-${index}`} className="text-sm text-gray-600">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.details.improvedVersions?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Versões sugeridas:
              </h4>
              <div className="grid gap-2">
                {validationResult.details.improvedVersions.map((version: string, index: number) => (
                  <Button
                    key={`version-${index}`}
                    variant="outline"
                    className="text-left h-auto py-2"
                    onClick={() => {
                      // Você pode implementar esta funcionalidade posteriormente, se necessário
                      console.log('Versão selecionada:', version);
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
