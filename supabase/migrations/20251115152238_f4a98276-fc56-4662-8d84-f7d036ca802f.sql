-- Criar tabela para templates de banners
CREATE TABLE IF NOT EXISTS public.banner_template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  structure JSONB NOT NULL, -- estrutura: grid, margens, seções
  colors JSONB NOT NULL, -- paleta de cores do template
  typography JSONB NOT NULL, -- fontes e tamanhos
  layout_config JSONB NOT NULL, -- configurações de layout (colunas, espaçamentos)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.banner_template_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.banner_template_presets
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON public.banner_template_presets
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir templates padrão baseados nos modelos analisados
INSERT INTO public.banner_template_presets (name, description, structure, colors, typography, layout_config) VALUES
(
  'FeciTEL Clássico',
  'Template padrão inspirado nos banners da Feira de Ciência e Tecnologia do IFMS',
  '{
    "sections": ["header", "title", "authors", "introduction", "methodology", "results", "conclusion", "references", "footer"],
    "headerElements": ["eventLogo", "institutionLogo", "campusInfo"],
    "footerElements": ["supportLogos", "realizationLogos"]
  }'::jsonb,
  '{
    "primary": "#1e40af",
    "secondary": "#0ea5e9",
    "accent": "#f59e0b",
    "text": "#1f2937",
    "background": "#ffffff",
    "sectionHeader": "#1e40af"
  }'::jsonb,
  '{
    "titleFont": "Arial Black",
    "titleSize": "32pt",
    "headingFont": "Arial",
    "headingSize": "24pt",
    "bodyFont": "Arial",
    "bodySize": "20pt",
    "captionSize": "18pt"
  }'::jsonb,
  '{
    "columns": 2,
    "marginTop": "2cm",
    "marginBottom": "2cm",
    "marginLeft": "2.5cm",
    "marginRight": "2.5cm",
    "columnGap": "1.5cm",
    "sectionSpacing": "1cm"
  }'::jsonb
),
(
  'FeciTEL Moderno',
  'Template com design mais limpo e espaçoso, 3 colunas',
  '{
    "sections": ["header", "title", "authors", "introduction", "methodology", "results", "conclusion", "footer"],
    "headerElements": ["eventLogo", "institutionLogo"],
    "footerElements": ["supportLogos"]
  }'::jsonb,
  '{
    "primary": "#0891b2",
    "secondary": "#06b6d4",
    "accent": "#22d3ee",
    "text": "#0f172a",
    "background": "#ffffff",
    "sectionHeader": "#0891b2"
  }'::jsonb,
  '{
    "titleFont": "Helvetica",
    "titleSize": "30pt",
    "headingFont": "Helvetica",
    "headingSize": "22pt",
    "bodyFont": "Helvetica",
    "bodySize": "19pt",
    "captionSize": "17pt"
  }'::jsonb,
  '{
    "columns": 3,
    "marginTop": "2cm",
    "marginBottom": "2cm",
    "marginLeft": "2cm",
    "marginRight": "2cm",
    "columnGap": "1cm",
    "sectionSpacing": "0.8cm"
  }'::jsonb
),
(
  'FeciTEL Minimalista',
  'Template clean com foco no conteúdo, 2 colunas largas',
  '{
    "sections": ["header", "title", "authors", "introduction", "objectives", "methodology", "results", "conclusion", "footer"],
    "headerElements": ["institutionLogo"],
    "footerElements": ["realizationLogos"]
  }'::jsonb,
  '{
    "primary": "#64748b",
    "secondary": "#94a3b8",
    "accent": "#f97316",
    "text": "#1e293b",
    "background": "#ffffff",
    "sectionHeader": "#64748b"
  }'::jsonb,
  '{
    "titleFont": "Arial",
    "titleSize": "28pt",
    "headingFont": "Arial",
    "headingSize": "22pt",
    "bodyFont": "Georgia",
    "bodySize": "19pt",
    "captionSize": "17pt"
  }'::jsonb,
  '{
    "columns": 2,
    "marginTop": "2.5cm",
    "marginBottom": "2.5cm",
    "marginLeft": "3cm",
    "marginRight": "3cm",
    "columnGap": "2cm",
    "sectionSpacing": "1.2cm"
  }'::jsonb
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_banner_template_presets_updated_at
  BEFORE UPDATE ON public.banner_template_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_banner_work_images_updated_at();