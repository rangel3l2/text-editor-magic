-- Adicionar política RLS para permitir acesso a trabalhos compartilhados via token
CREATE POLICY "Permitir acesso via share_token"
ON public.work_in_progress
FOR SELECT
USING (share_token IS NOT NULL);

-- Função para buscar trabalho compartilhado com validação de token
CREATE OR REPLACE FUNCTION public.get_shared_work(p_token text)
RETURNS SETOF public.work_in_progress
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM work_in_progress
  WHERE share_token = p_token
  AND share_token IS NOT NULL;
$$;