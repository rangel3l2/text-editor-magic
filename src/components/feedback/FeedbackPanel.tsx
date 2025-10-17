import { motion, AnimatePresence } from "framer-motion";
import FeedbackMessage, { FeedbackType } from "./FeedbackMessage";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  explanation: string;
  suggestion: string;
}

interface FeedbackPanelProps {
  feedbacks: Feedback[];
  progressValue?: number;
  progressLabel?: string;
  onFeedbackClose?: (id: string) => void;
  className?: string;
}

const FeedbackPanel = ({
  feedbacks,
  progressValue = 0,
  progressLabel = "Progresso da orientação",
  onFeedbackClose,
  className,
}: FeedbackPanelProps) => {
  const successCount = feedbacks.filter(f => f.type === "success" || f.type === "excellent").length;
  const totalCount = feedbacks.length;

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

        {/* Lista de feedbacks */}
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
