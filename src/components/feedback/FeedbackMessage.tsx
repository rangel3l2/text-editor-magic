import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";

export type FeedbackType = "success" | "tip" | "warning" | "excellent";

interface FeedbackMessageProps {
  type: FeedbackType;
  title: string;
  explanation: string;
  suggestion: string;
  className?: string;
  onClose?: () => void;
}

const feedbackConfig = {
  success: {
    icon: CheckCircle2,
    emoji: "✅",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-900 dark:text-green-100",
    iconColor: "text-green-600 dark:text-green-400",
    accentColor: "bg-green-500",
  },
  tip: {
    icon: Lightbulb,
    emoji: "💡",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentColor: "bg-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    emoji: "⚠️",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    accentColor: "bg-yellow-500",
  },
  excellent: {
    icon: Sparkles,
    emoji: "✨",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    textColor: "text-purple-900 dark:text-purple-100",
    iconColor: "text-purple-600 dark:text-purple-400",
    accentColor: "bg-purple-500",
  },
};

const FeedbackMessage = ({
  type,
  title,
  explanation,
  suggestion,
  className,
  onClose,
}: FeedbackMessageProps) => {
  const config = feedbackConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className={cn("relative", className)}
      role="alert"
      aria-live="polite"
    >
      {/* Barra de destaque lateral */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", config.accentColor)} />
      
      <Alert
        className={cn(
          "border-2 pl-6 shadow-lg hover:shadow-xl transition-all duration-300",
          config.bgColor,
          config.borderColor,
          config.textColor
        )}
      >
        <div className="flex items-start gap-3">
          {/* Ícone com animação */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="flex-shrink-0 mt-0.5"
          >
            <Icon 
              className={cn("h-5 w-5 sm:h-6 sm:w-6", config.iconColor)} 
              aria-hidden="true"
            />
          </motion.div>

          <div className="flex-1 space-y-2 min-w-0">
            {/* Título com emoji */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg" role="img" aria-label={type}>
                {config.emoji}
              </span>
              <h4 className="font-semibold text-sm sm:text-base leading-tight">
                {title}
              </h4>
            </motion.div>

            {/* Explicação */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                {explanation}
              </AlertDescription>
            </motion.div>

            {/* Sugestão prática com destaque */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "flex items-start gap-2 pt-2 border-t",
                config.borderColor
              )}
            >
              <span className="text-base flex-shrink-0" role="img" aria-label="sugestão">
                👉
              </span>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {suggestion}
              </p>
            </motion.div>
          </div>

          {/* Botão de fechar (opcional) */}
          {onClose && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className={cn(
                "flex-shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                config.iconColor
              )}
              aria-label="Fechar mensagem"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
      </Alert>
    </motion.div>
  );
};

export default FeedbackMessage;
