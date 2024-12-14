export const calculateTextProgress = (text: string, maxLines: number, minLines: number) => {
  // Remove HTML tags e espaços em branco extras
  const plainText = text.replace(/<[^>]*>/g, '').trim();
  
  // Se o texto estiver vazio, retorna 0%
  if (!plainText) {
    return {
      percentage: 0,
      actualLines: 0,
      isOverLimit: false,
      isBelowMinimum: minLines > 0
    };
  }

  // Calcula o número de linhas
  const lines = plainText.split('\n').length;
  const chars = plainText.length;
  const avgCharsPerLine = 80; // Média aproximada de caracteres por linha
  const estimatedLines = Math.ceil(chars / avgCharsPerLine);
  const actualLines = Math.max(lines, estimatedLines);
  
  // Calcula a porcentagem baseada no número máximo de linhas
  const percentage = Math.min((actualLines / maxLines) * 100, 100);
  
  return {
    percentage,
    actualLines,
    isOverLimit: actualLines > maxLines,
    isBelowMinimum: actualLines < minLines
  };
};