-- Adicionar campos aos banner_templates para torná-los compartilháveis
ALTER TABLE public.banner_templates 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN share_token text UNIQUE,
ADD COLUMN default_logo_url text,
ADD COLUMN default_institution_name text,
ADD COLUMN views_count integer DEFAULT 0;

-- Criar índice para busca rápida por token
CREATE INDEX idx_banner_templates_share_token ON public.banner_templates(share_token) WHERE share_token IS NOT NULL;

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    -- Gerar token aleatório de 12 caracteres
    token := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM banner_templates WHERE share_token = token) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Atualizar RLS para permitir acesso público aos templates compartilhados
CREATE POLICY "Anyone can view public banner templates"
ON public.banner_templates
FOR SELECT
USING (is_public = true);

-- Permitir incrementar contador de visualizações
CREATE POLICY "Anyone can increment view count on public templates"
ON public.banner_templates
FOR UPDATE
USING (is_public = true)
WITH CHECK (is_public = true);