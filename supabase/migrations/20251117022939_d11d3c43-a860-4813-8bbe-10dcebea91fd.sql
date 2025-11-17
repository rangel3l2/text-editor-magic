-- Adicionar coluna para indicar a seção onde a imagem deve aparecer
ALTER TABLE public.banner_work_images 
ADD COLUMN section TEXT DEFAULT 'results';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.banner_work_images.section IS 'Indica em qual seção do banner a imagem deve aparecer: introduction, objectives, methodology, results, discussion, conclusion, references';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_banner_work_images_section ON public.banner_work_images(section);