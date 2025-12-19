import { motion, AnimatePresence } from "framer-motion";
import FeedbackMessage, { FeedbackType } from "./FeedbackMessage";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  explanation: string;
  suggestion: string;
}

interface ScaffoldingProgress {
  correctedCount: number;
  pendingCount: number;
  totalCount: number;
  progressPercentage: number;
  motivationalMessage: string;
  correctedFeedbacks: string[];
}

interface FeedbackPanelProps {
  feedbacks: Feedback[];
  progressValue?: number;
  progressLabel?: string;
  onFeedbackClose?: (id: string) => void;
  onRevalidate?: () => void;
  isRevalidating?: boolean;
  scaffoldingProgress?: ScaffoldingProgress;
  className?: string;
}

const FeedbackPanel = ({
  feedbacks,
  progressValue = 0,
  progressLabel = "Progresso da orientação",
  onFeedbackClose,
  onRevalidate,
  isRevalidating = false,
  scaffoldingProgress,
  className,
}: FeedbackPanelProps) => {
  const successCount = feedbacks.filter(f => f.type === "success" || f.type === "excellent" || f.type === "corrected").length;
  const totalCount = feedbacks.length;
  const hasFeedback = feedbacks.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span>Orientação Virtual</span>
          </CardTitle>
          {totalCount > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
            >
              {successCount}/{totalCount} ✓
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mensagem motivacional de progresso (Teoria do Andaime) */}
        {scaffoldingProgress && scaffoldingProgress.motivationalMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800"
          >
            <p className="text-sm sm:text-base font-medium text-emerald-900 dark:text-emerald-100">
              {scaffoldingProgress.motivationalMessage}
            </p>
            {scaffoldingProgress.progressPercentage > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                  <span>Progresso</span>
                  <span className="font-semibold">{scaffoldingProgress.progressPercentage}%</span>
                </div>
                <Progress 
                  value={scaffoldingProgress.progressPercentage} 
                  className="h-2"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Seção de problemas corrigidos */}
        {scaffoldingProgress && scaffoldingProgress.correctedCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Problemas Corrigidos ({scaffoldingProgress.correctedCount})
            </h4>
            <div className="space-y-1 pl-6">
              {scaffoldingProgress.correctedFeedbacks.slice(0, 5).map((feedback, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                >
                  <span>✅</span>
                  <span className="capitalize line-through opacity-70">{feedback}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Barra de progresso */}
        {progressValue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span>{progressLabel}</span>
              <motion.span
                key={progressValue}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-semibold text-purple-600 dark:text-purple-400"
              >
                {progressValue}%
              </motion.span>
            </div>
            <Progress 
              value={progressValue} 
              className="h-2 sm:h-3"
            />
          </motion.div>
        )}

        {/* Lista de feedbacks pendentes */}
        <AnimatePresence mode="popLayout">
          {feedbacks.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {feedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      delay: index * 0.1,
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.9,
                    transition: {
                      duration: 0.2,
                    }
                  }}
                >
                  <FeedbackMessage
                    type={feedback.type}
                    title={feedback.title}
                    explanation={feedback.explanation}
                    suggestion={feedback.suggestion}
                    onClose={onFeedbackClose ? () => onFeedbackClose(feedback.id) : undefined}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <p className="text-sm sm:text-base">
                Escreva seu texto para receber orientações personalizadas 📝
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de revalidação */}
        {hasFeedback && onRevalidate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={onRevalidate}
              disabled={isRevalidating}
              variant="outline"
              size="lg"
              className="w-full gap-2 py-4 border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
            >
              <RefreshCw className={`h-5 w-5 text-primary ${isRevalidating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="font-semibold text-sm sm:text-base">
                {isRevalidating ? 'Verificando...' : '🔄 Verificar minhas correções'}
              </span>
            </Button>
          </motion.div>
        )}

        {/* Mensagem de conclusão */}
        {feedbacks.length > 0 && successCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800"
          >
            <p className="text-sm sm:text-base font-medium text-center text-purple-900 dark:text-purple-100">
              🎉 Excelente trabalho! Continue assim! ✨
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackPanel;
