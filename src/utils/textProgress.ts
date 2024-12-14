export const calculateTextProgress = (text: string, maxLines: number, minLines: number) => {
  const plainText = text.replace(/<[^>]*>/g, '');
  const lines = plainText.split('\n').length;
  const chars = plainText.length;
  const avgCharsPerLine = 80;
  const estimatedLines = Math.ceil(chars / avgCharsPerLine);
  const actualLines = Math.max(lines, estimatedLines);
  
  const percentage = Math.min((actualLines / maxLines) * 100, 100);
  
  return {
    percentage,
    actualLines,
    isOverLimit: percentage >= 100,
    isBelowMinimum: actualLines < minLines
  };
};