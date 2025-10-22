interface LineCountOptions {
  columns?: number;
  fontSize?: number;
}

export const countTextLines = (content: string, options: LineCountOptions = {}) => {
  if (!content) return 0;
  
  const { columns = 2, fontSize = 12 } = options;
  
  // Remove HTML tags
  const textWithoutTags = content.replace(/<[^>]*>/g, '');
  
  // Split by line breaks and filter out empty lines
  const lines = textWithoutTags
    .split(/\r\n|\r|\n/)
    .filter(line => line.trim().length > 0);

  // Calculate characters per line based on columns and font size
  // Para fonte 12pt em duas colunas, aproximadamente 60-70 caracteres por linha
  const baseCharsPerLine = 120; // Base para uma coluna (ajustado para banners reais)
  const charsPerLine = Math.floor(baseCharsPerLine / columns);
  
  let totalLines = 0;

  lines.forEach(line => {
    const lineLength = line.trim().length;
    const additionalLines = Math.ceil(lineLength / charsPerLine);
    totalLines += additionalLines;
  });

  return totalLines;
};