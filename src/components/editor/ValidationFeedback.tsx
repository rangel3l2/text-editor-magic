import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw, WifiOff } from "lucide-react";
import FeedbackPanel from "@/components/feedback/FeedbackPanel";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";
import { useEffect, useState } from "react";

interface ValidationFeedbackProps {
  validationResult: any;
  isValidating: boolean;
  errorMessage?: string | null;
  currentSection: string;
}

const ValidationFeedback = ({ 
  validationResult, 
  isValidating, 
  errorMessage,
  currentSection 
}: ValidationFeedbackProps) => {
  const { playFeedbackSound } = useFeedbackSound();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

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
  }, [validationResult, playFeedbackSound]);

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
      <Alert variant="destructive" className="bg-red-50">
        {isCorsOrConnectionError ? (
          <WifiOff className="h-4 w-4 text-red-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertTitle>
          {isCorsOrConnectionError 
            ? "Erro de conexão com o orientador virtual" 
            : "Erro na validação"}
        </AlertTitle>
        <AlertDescription>
          {isCorsOrConnectionError 
            ? "Não foi possível conectar ao orientador virtual. Você pode continuar trabalhando normalmente enquanto resolvemos o problema." 
            : errorMessage}
        </AlertDescription>
      </Alert>
    );
  }

  // Se não temos resultado ou feedbacks, não mostra nada
  if (!validationResult || !feedbacks.length) {
    return null;
  }

  
  
  // Mostrar FeedbackPanel com os feedbacks estruturados
  return (
    <FeedbackPanel
      feedbacks={feedbacks}
      progressLabel={`Orientação para: ${currentSection || "Conteúdo"}`}
      className="animate-fade-in"
    />
  );
};

export default ValidationFeedback;
