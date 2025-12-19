/**
 * Feedback History - Implementação da Teoria do Andaime (Scaffolding)
 * 
 * Quando o aluno corrige um erro, o "andaime" é removido.
 * O feedback só reaparece se o aluno regredir (cometer o mesmo erro novamente).
 */

export interface FeedbackHistoryEntry {
  feedbackKey: string;          // Chave única baseada no tipo/título
  lastSeenAt: number;           // Última vez que apareceu
  resolvedAt: number | null;    // Quando foi corrigido (andaime removido)
  occurrences: number;          // Quantas vezes apareceu
}

export interface SectionFeedbackHistory {
  feedbacks: FeedbackHistoryEntry[];
  lastValidationAt: number;
}

const STORAGE_PREFIX = 'feedback_history_';
const HISTORY_EXPIRATION_DAYS = 7;

/**
 * Gera uma chave única para um feedback baseada no tipo e título normalizado
 */
export function generateFeedbackKey(feedback: { type?: string; title?: string; message?: string }): string {
  const type = feedback.type || 'unknown';
  const title = (feedback.title || feedback.message || '').toLowerCase().trim();
  
  // Normaliza removendo acentos e caracteres especiais para comparação
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limita tamanho da chave
  
  return `${type}_${normalizedTitle}`;
}

/**
 * Carrega o histórico de feedbacks de uma seção
 */
export function loadFeedbackHistory(sectionName: string): SectionFeedbackHistory | null {
  try {
    const key = `${STORAGE_PREFIX}${sectionName}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    const history = JSON.parse(stored) as SectionFeedbackHistory;
    
    // Verifica expiração
    const expirationMs = HISTORY_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - history.lastValidationAt > expirationMs) {
      localStorage.removeItem(key);
      return null;
    }
    
    return history;
  } catch (e) {
    console.error(`Erro ao carregar histórico de feedbacks para "${sectionName}":`, e);
    return null;
  }
}

/**
 * Salva o histórico de feedbacks de uma seção
 */
export function saveFeedbackHistory(sectionName: string, history: SectionFeedbackHistory): void {
  try {
    const key = `${STORAGE_PREFIX}${sectionName}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error(`Erro ao salvar histórico de feedbacks para "${sectionName}":`, e);
  }
}

/**
 * Processa feedbacks atuais comparando com o histórico
 * Implementa a lógica da Teoria do Andaime:
 * - Feedbacks corrigidos são marcados como resolvidos
 * - Feedbacks resolvidos não aparecem novamente
 * - Se o erro voltar, o feedback reaparece
 */
export function processAndFilterFeedbacks(
  sectionName: string,
  currentFeedbacks: any[]
): any[] {
  if (!currentFeedbacks || !Array.isArray(currentFeedbacks)) {
    return [];
  }

  const history = loadFeedbackHistory(sectionName) || {
    feedbacks: [],
    lastValidationAt: Date.now()
  };

  const now = Date.now();
  const currentFeedbackKeys = new Set<string>();
  const filteredFeedbacks: any[] = [];

  // Processa cada feedback atual
  for (const feedback of currentFeedbacks) {
    const key = generateFeedbackKey(feedback);
    currentFeedbackKeys.add(key);

    // Busca no histórico
    const historyEntry = history.feedbacks.find(h => h.feedbackKey === key);

    if (historyEntry) {
      if (historyEntry.resolvedAt !== null) {
        // Feedback estava resolvido mas reapareceu - aluno regrediu
        // Remove o status de resolvido e mostra novamente
        console.log(`📚 [Andaime] Feedback reapareceu após correção: "${feedback.title}"`);
        historyEntry.resolvedAt = null;
        historyEntry.lastSeenAt = now;
        historyEntry.occurrences++;
        filteredFeedbacks.push(feedback);
      } else {
        // Feedback já existia e não estava resolvido - continua mostrando
        historyEntry.lastSeenAt = now;
        historyEntry.occurrences++;
        filteredFeedbacks.push(feedback);
      }
    } else {
      // Novo feedback - adiciona ao histórico e mostra
      console.log(`📚 [Andaime] Novo feedback detectado: "${feedback.title}"`);
      history.feedbacks.push({
        feedbackKey: key,
        lastSeenAt: now,
        resolvedAt: null,
        occurrences: 1
      });
      filteredFeedbacks.push(feedback);
    }
  }

  // Marca como resolvidos os feedbacks que não aparecem mais
  // (o aluno corrigiu o problema - andaime removido)
  for (const entry of history.feedbacks) {
    if (!currentFeedbackKeys.has(entry.feedbackKey) && entry.resolvedAt === null) {
      console.log(`✅ [Andaime] Feedback corrigido pelo aluno: "${entry.feedbackKey}" - andaime removido`);
      entry.resolvedAt = now;
    }
  }

  // Atualiza timestamp e salva histórico
  history.lastValidationAt = now;
  saveFeedbackHistory(sectionName, history);

  return filteredFeedbacks;
}

/**
 * Limpa o histórico de feedbacks de uma seção específica
 */
export function clearFeedbackHistory(sectionName: string): void {
  try {
    const key = `${STORAGE_PREFIX}${sectionName}`;
    localStorage.removeItem(key);
    console.log(`🗑️ Histórico de feedbacks limpo para "${sectionName}"`);
  } catch (e) {
    console.error(`Erro ao limpar histórico de feedbacks para "${sectionName}":`, e);
  }
}

/**
 * Limpa todo o histórico de feedbacks (todas as seções)
 */
export function clearAllFeedbackHistory(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Todo histórico de feedbacks limpo (${keysToRemove.length} seções)`);
  } catch (e) {
    console.error('Erro ao limpar todo histórico de feedbacks:', e);
  }
}

/**
 * Obtém estatísticas do histórico de uma seção
 */
export function getFeedbackStats(sectionName: string): {
  totalFeedbacks: number;
  resolvedFeedbacks: number;
  activeFeedbacks: number;
} | null {
  const history = loadFeedbackHistory(sectionName);
  if (!history) return null;

  const resolved = history.feedbacks.filter(f => f.resolvedAt !== null).length;
  const active = history.feedbacks.filter(f => f.resolvedAt === null).length;

  return {
    totalFeedbacks: history.feedbacks.length,
    resolvedFeedbacks: resolved,
    activeFeedbacks: active
  };
}

/**
 * Obtém o progresso de validação com mensagens motivacionais (Teoria do Andaime)
 */
export function getValidationProgress(sectionName: string): {
  correctedCount: number;
  pendingCount: number;
  totalCount: number;
  progressPercentage: number;
  motivationalMessage: string;
  correctedFeedbacks: string[];
} {
  const history = loadFeedbackHistory(sectionName);
  
  if (!history || history.feedbacks.length === 0) {
    return {
      correctedCount: 0,
      pendingCount: 0,
      totalCount: 0,
      progressPercentage: 0,
      motivationalMessage: '',
      correctedFeedbacks: []
    };
  }

  const corrected = history.feedbacks.filter(f => f.resolvedAt !== null);
  const pending = history.feedbacks.filter(f => f.resolvedAt === null);
  const total = history.feedbacks.length;
  const correctedCount = corrected.length;
  const pendingCount = pending.length;
  const progressPercentage = total > 0 ? Math.round((correctedCount / total) * 100) : 0;

  // Mensagens motivacionais baseadas no progresso
  let motivationalMessage = '';
  if (correctedCount === 0 && pendingCount > 0) {
    motivationalMessage = `📝 Você tem ${pendingCount} ${pendingCount === 1 ? 'ponto' : 'pontos'} para melhorar. Vamos lá!`;
  } else if (correctedCount > 0 && pendingCount > 0) {
    motivationalMessage = `🎉 Excelente! Você corrigiu ${correctedCount} de ${total} ${total === 1 ? 'problema' : 'problemas'}! Continue assim!`;
  } else if (correctedCount === total && total > 0) {
    motivationalMessage = '🏆 Parabéns! Você corrigiu todos os problemas identificados! Seu texto está muito melhor!';
  }

  // Extrai os nomes dos feedbacks corrigidos
  const correctedFeedbacks = corrected.map(f => {
    // Reconstrói o título a partir da chave
    const parts = f.feedbackKey.split('_');
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/_/g, ' ');
    }
    return f.feedbackKey;
  });

  return {
    correctedCount,
    pendingCount,
    totalCount: total,
    progressPercentage,
    motivationalMessage,
    correctedFeedbacks
  };
}
