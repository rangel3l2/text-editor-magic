import { BannerContent } from '@/components/banner/useBannerContent';

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  // Por enquanto retornamos um arquivo vazio
  // Isso será implementado posteriormente com a lógica completa do DOCX
  return new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
};