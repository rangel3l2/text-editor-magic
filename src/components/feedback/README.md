# 🎓 Sistema de Orientação Virtual - Feedback Educacional

Sistema completo de feedback visual para orientação de alunos durante a escrita acadêmica, seguindo as melhores práticas de UX educacional.

## 📦 Componentes

### 1. `FeedbackMessage`
Componente individual de feedback com estrutura padronizada.

**Tipos de Feedback:**
- `success` ✅ - Verde - Para conquistas e melhorias aplicadas
- `tip` 💡 - Azul - Para dicas e orientações construtivas  
- `warning` ⚠️ - Amarelo - Para alertas amigáveis e pontos de atenção
- `excellent` ✨ - Roxo - Para trabalhos excepcionais

**Estrutura de cada mensagem:**
1. Ícone/Emoji representativo
2. Título curto (1 linha)
3. Explicação breve (1-2 linhas)
4. Sugestão prática (1 linha)

### 2. `FeedbackPanel`
Painel completo com múltiplos feedbacks e barra de progresso.

**Recursos:**
- Lista de feedbacks animados
- Barra de progresso visual
- Contador de sucessos
- Mensagem de conclusão
- Suporte a remoção individual

### 3. `useFeedbackSound`
Hook para sons de feedback usando Web Audio API.

**Sons disponíveis:**
- Success: Sol (G5) - 800Hz
- Tip: Ré (D5) - 600Hz
- Warning: Dó (C5) - 500Hz
- Excellent: Sequência de notas ascendente

## 🎨 Características de Design

### Cores e Emoções
- **Azul** → Confiança e tranquilidade (orientação)
- **Verde** → Progresso e sucesso
- **Amarelo** → Curiosidade e alerta amigável
- **Roxo** → Excelência e conquista
- ❌ **Sem vermelho** para correções de aprendizado

### Microinterações
- ✨ Animação suave (fade-in + bounce)
- 🔊 Sons curtos e agradáveis
- 🎨 Mudança de cor em tempo real
- 📊 Progressão visual clara
- ⚡ Feedback instantâneo

### Acessibilidade
- ✓ Contraste mínimo 4.5:1
- ✓ Suporte a leitores de tela (aria-labels)
- ✓ Tamanho ajustável da fonte
- ✓ Mensagens curtas e claras
- ✓ Animações respeitam prefers-reduced-motion

## 📖 Exemplos de Uso

### Uso Básico

\`\`\`tsx
import FeedbackMessage from "@/components/feedback/FeedbackMessage";

<FeedbackMessage
  type="tip"
  title="Quase lá!"
  explanation="Sua explicação está boa, mas faltou conectar as ideias."
  suggestion='Tente usar palavras como "porque", "então" ou "por isso".'
/>
\`\`\`

### Painel Completo com Progresso

\`\`\`tsx
import FeedbackPanel from "@/components/feedback/FeedbackPanel";

const feedbacks = [
  {
    id: "1",
    type: "tip",
    title: "Quase lá!",
    explanation: "Sua explicação está boa, mas faltou conectar as ideias.",
    suggestion: "Tente usar conectivos para melhorar a fluidez.",
  },
  {
    id: "2",
    type: "success",
    title: "Muito bem!",
    explanation: "Você melhorou bastante a argumentação.",
    suggestion: "Continue assim! Seu texto está ficando claro.",
  },
];

<FeedbackPanel
  feedbacks={feedbacks}
  progressValue={50}
  progressLabel="Seu progresso de escrita"
  onFeedbackClose={(id) => removeFeedback(id)}
/>
\`\`\`

### Com Sons

\`\`\`tsx
import { useFeedbackSound } from "@/hooks/useFeedbackSound";

const { playFeedbackSound } = useFeedbackSound();

// Ao adicionar feedback
playFeedbackSound("success");
\`\`\`

### Integração com Validação de Texto

\`\`\`tsx
import { useState } from "react";
import FeedbackPanel from "@/components/feedback/FeedbackPanel";
import { useFeedbackSound } from "@/hooks/useFeedbackSound";

const TextEditor = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const { playFeedbackSound } = useFeedbackSound();

  const validateText = async (text: string) => {
    // Chame sua API de validação
    const result = await validateWithAI(text);
    
    // Crie feedback baseado na resposta
    const newFeedback = {
      id: Date.now().toString(),
      type: result.score > 80 ? "excellent" : "tip",
      title: result.title,
      explanation: result.explanation,
      suggestion: result.suggestion,
    };
    
    setFeedbacks(prev => [...prev, newFeedback]);
    playFeedbackSound(newFeedback.type);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <textarea 
          onChange={(e) => validateText(e.target.value)}
          className="w-full h-64"
        />
      </div>
      <FeedbackPanel
        feedbacks={feedbacks}
        progressValue={calculateProgress(feedbacks)}
        onFeedbackClose={(id) => setFeedbacks(prev => 
          prev.filter(f => f.id !== id)
        )}
      />
    </div>
  );
};
\`\`\`

## 🔧 Personalização

### Cores Customizadas

Edite `feedbackConfig` em `FeedbackMessage.tsx`:

\`\`\`tsx
const feedbackConfig = {
  custom: {
    icon: YourIcon,
    emoji: "🎯",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-900 dark:text-orange-100",
    iconColor: "text-orange-600 dark:text-orange-400",
    accentColor: "bg-orange-500",
  },
};
\`\`\`

### Sons Personalizados

Modifique as frequências em `useFeedbackSound.ts`:

\`\`\`tsx
const soundFrequencies = {
  custom: 700, // Sua frequência em Hz
};
\`\`\`

## 📱 Responsividade

Todos os componentes são totalmente responsivos:
- Textos adaptam tamanho em mobile (`text-xs sm:text-sm`)
- Espaçamentos ajustáveis (`gap-3 sm:gap-4`)
- Layout flexível para diferentes telas
- Touch-friendly (botões com área mínima de toque)

## 🎯 Boas Práticas

1. **Seja Específico**: Feedbacks genéricos não ajudam
2. **Seja Breve**: Máximo 2 linhas por seção
3. **Seja Construtivo**: Sempre ofereça uma solução
4. **Seja Encorajador**: Use linguagem positiva
5. **Seja Consistente**: Mantenha o mesmo padrão

## 🚀 Próximos Passos

- [ ] Adicionar mais tipos de feedback
- [ ] Implementar histórico de feedbacks
- [ ] Criar sistema de badges/conquistas
- [ ] Adicionar feedback por voz (text-to-speech)
- [ ] Implementar modo de comparação antes/depois
