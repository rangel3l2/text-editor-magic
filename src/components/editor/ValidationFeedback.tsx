import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw, WifiOff } from "lucide-react";
import FeedbackPanel from "@/components/feedback/FeedbackPanel";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getValidationProgress } from "@/utils/feedbackHistory";

interface ValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
  errorMessage?: string | null;
  currentSection: string;
  onRetry?: () => void;
  onRevalidate?: () => void;
}

const ValidationFeedback = ({ 
  validationResult, 
  isValidating, 
  errorMessage,
  currentSection,
  onRetry,
  onRevalidate
}: ValidationFeedbackProps) => {
  const { playFeedbackSound } = useFeedbackSound();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [scaffoldingProgress, setScaffoldingProgress] = useState<ReturnType<typeof getValidationProgress> | undefined>();

  // Processar resultado de validação e tocar sons
  useEffect(() => {
    console.log('📊 ValidationFeedback - validationResult:', validationResult);
    
    // Evita avisos enquanto ainda não houve validação
    if (validationResult == null) {
      return;
    }
    
    if (validationResult?.feedbacks && Array.isArray(validationResult.feedbacks)) {
      console.log('✅ Processando feedbacks:', validationResult.feedbacks.length);
      setFeedbacks(validationResult.feedbacks);
      
      // Atualizar progresso do andaime
      if (currentSection) {
        const progress = getValidationProgress(currentSection);
        setScaffoldingProgress(progress);
      }
      
      // Tocar som baseado no tipo predominante
      const types = validationResult.feedbacks.map((f: any) => f.type);
      if (types.includes('excellent')) {
        playFeedbackSound('excellent');
      } else if (types.includes('success')) {
        playFeedbackSound('success');
      } else if (types.includes('warning')) {
        playFeedbackSound('warning');
      } else {
        playFeedbackSound('tip');
      }
    } else {
      console.warn('⚠️ validationResult não tem feedbacks ou formato incorreto:', validationResult);
    }
  }, [validationResult, playFeedbackSound, currentSection]);

  // Se não está validando a seção atual ou não há resultado, não mostra nada
  if (!isValidating && !validationResult && !errorMessage) return null;

  // Está validando
  if (isValidating) {
    return (
      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <RefreshCcw className="h-4 w-4 animate-spin text-blue-500" />
        <AlertTitle>Validando seção: {currentSection || "Conteúdo"}</AlertTitle>
        <AlertDescription>
          Estamos analisando seu texto quanto à clareza, coerência, normas ABNT e padrões acadêmicos.
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

  // Se não temos resultado ou feedbacks, não mostra nada
  if (!validationResult || !feedbacks.length) {
    return null;
  }

  // Mostrar FeedbackPanel com os feedbacks estruturados e opções de revalidação
  return (
    <FeedbackPanel
      feedbacks={feedbacks}
      progressLabel={`Orientação para: ${currentSection || "Conteúdo"}`}
      onRevalidate={onRevalidate}
      isRevalidating={isValidating}
      scaffoldingProgress={scaffoldingProgress}
      className="animate-fade-in"
    />
  );
};

export default ValidationFeedback;
