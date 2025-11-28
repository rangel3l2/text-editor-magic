
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TitleValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

const TitleValidationFeedback = ({ 
  validationResult, 
  isValidating,
  errorMessage,
  onRetry
}: TitleValidationFeedbackProps) => {
  // Verifica se está no processo de validação
  if (isValidating) {
    return (
      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <RefreshCcw className="h-4 w-4 animate-spin text-blue-500" />
        <AlertTitle>Validando título...</AlertTitle>
        <AlertDescription>
          Estamos analisando seu título quanto à clareza, objetividade e normas acadêmicas.
        </AlertDescription>
      </Alert>
    );
  }

  // Se temos uma mensagem de erro específica (inclui erros de CORS)
  if (errorMessage) {
    // Identifica se é erro de CORS ou conexão
    const isCorsOrConnectionError = 
      errorMessage.includes('CORS') || 
      errorMessage.includes('Failed to fetch') || 
      errorMessage.includes('Network Error') ||
      errorMessage.includes('Edge Function');
    
    return (
      <Alert variant="destructive" className="bg-red-50 text-sm">
        <div className="flex items-start gap-2 md:gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {isCorsOrConnectionError ? (
              <WifiOff className="h-4 w-4 text-red-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <AlertTitle className="text-sm md:text-base">
              {isCorsOrConnectionError 
                ? "Erro de conexão" 
                : "Erro na validação"}
            </AlertTitle>
            <AlertDescription className="space-y-2 md:space-y-3">
              <p className="text-xs md:text-sm">
                {isCorsOrConnectionError 
                  ? "Não foi possível conectar. Você pode continuar trabalhando." 
                  : errorMessage}
              </p>
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  variant="outline" 
                  size="sm"
                  className="gap-2 bg-white hover:bg-red-50 text-xs h-8"
                >
                  <RefreshCcw className="h-3 w-3" />
                  Tentar Novamente
                </Button>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }

  if (!validationResult) return null;

  const { isValid, overallFeedback, details, error } = validationResult;

  // Se temos um erro genérico
  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle>Erro na validação</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Título válido
  if (isValid) {
    return (
      <Alert className="bg-green-50 text-green-800 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Título validado</AlertTitle>
        <AlertDescription>{overallFeedback}</AlertDescription>
      </Alert>
    );
  }

  // Título inválido com feedback
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle>Sugestões de melhoria</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{overallFeedback}</p>
          
          {details && (
            <div className="mt-2">
              {details.spellingErrors && details.spellingErrors.length > 0 && (
                <div className="mt-1">
                  <p className="font-semibold text-sm">Possíveis erros ortográficos:</p>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {details.spellingErrors.map((error: string, i: number) => (
                      <li key={`spell-${i}`}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {details.coherenceIssues && details.coherenceIssues.length > 0 && (
                <div className="mt-1">
                  <p className="font-semibold text-sm">Problemas de coerência:</p>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {details.coherenceIssues.map((issue: string, i: number) => (
                      <li key={`coh-${i}`}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {details.suggestions && details.suggestions.length > 0 && (
                <div className="mt-1">
                  <p className="font-semibold text-sm">Sugestões:</p>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {details.suggestions.map((suggestion: string, i: number) => (
                      <li key={`sug-${i}`}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {details.improvedVersions && details.improvedVersions.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-sm">Versões melhoradas:</p>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {details.improvedVersions.map((version: string | {original: string, improved: string}, i: number) => (
                      <li key={`ver-${i}`}>
                        {typeof version === 'object' ? 
                         (version.improved || version.original || JSON.stringify(version)) : 
                         version}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TitleValidationFeedback;
