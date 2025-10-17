import { useState } from "react";
import FeedbackPanel, { Feedback } from "./FeedbackPanel";
import { Button } from "@/components/ui/button";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";

// Exemplo de uso do componente de feedback
const FeedbackExample = () => {
  const { playFeedbackSound } = useFeedbackSound();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [progress, setProgress] = useState(0);

  const exampleFeedbacks: Omit<Feedback, "id">[] = [
    {
      type: "tip",
      title: "Quase lá!",
      explanation: "Sua explicação está boa, mas faltou conectar as ideias.",
      suggestion: 'Tente usar palavras como "porque", "então" ou "por isso" para deixar o texto mais fluido.',
    },
    {
      type: "success",
      title: "Boa tentativa!",
      explanation: "Você escreveu bem, mas precisa justificar melhor sua ideia.",
      suggestion: "Tente começar explicando o conceito antes de dar o exemplo.",
    },
    {
      type: "warning",
      title: "Atenção ao formato",
      explanation: "O texto está um pouco confuso. Organize melhor os parágrafos.",
      suggestion: "Separe cada ideia principal em um parágrafo diferente.",
    },
    {
      type: "excellent",
      title: "Excelente trabalho!",
      explanation: "Sua argumentação está clara, bem estruturada e convincente.",
      suggestion: "Continue desenvolvendo suas ideias dessa forma. Você está no caminho certo!",
    },
  ];

  const addRandomFeedback = () => {
    const randomFeedback = exampleFeedbacks[Math.floor(Math.random() * exampleFeedbacks.length)];
    const newFeedback: Feedback = {
      ...randomFeedback,
      id: Date.now().toString(),
    };

    setFeedbacks(prev => [...prev, newFeedback]);
    setProgress(prev => Math.min(prev + 25, 100));
    playFeedbackSound(newFeedback.type);
  };

  const removeFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFeedbacks([]);
    setProgress(0);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={addRandomFeedback} size="sm">
          Adicionar Feedback
        </Button>
        <Button onClick={clearAll} variant="outline" size="sm">
          Limpar Tudo
        </Button>
      </div>

      <FeedbackPanel
        feedbacks={feedbacks}
        progressValue={progress}
        progressLabel="Seu progresso de escrita"
        onFeedbackClose={removeFeedback}
      />
    </div>
  );
};

export default FeedbackExample;
