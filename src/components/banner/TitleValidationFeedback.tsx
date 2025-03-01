
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCcw, WifiOff } from "lucide-react";

interface TitleValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
  errorMessage?: string | null;
}

const TitleValidationFeedback = ({ 
  validationResult, 
  isValidating,
  errorMessage
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
      <Alert variant="destructive" className="bg-red-50">
        {isCorsOrConnectionError ? (
          <WifiOff className="h-4 w-4 text-red-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertTitle>
          {isCorsOrConnectionError 
            ? "Erro de conexão com o serviço de validação" 
            : "Erro na validação"}
        </AlertTitle>
        <AlertDescription>
          {isCorsOrConnectionError 
            ? "Não foi possível conectar ao serviço de validação. Você pode continuar trabalhando normalmente enquanto nossa equipe resolve o problema." 
            : errorMessage}
        </AlertDescription>
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
                    {details.improvedVersions.map((version: string, i: number) => (
                      <li key={`ver-${i}`}>{version}</li>
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
