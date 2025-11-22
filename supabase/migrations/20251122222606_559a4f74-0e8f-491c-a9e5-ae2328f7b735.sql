-- Remover política que causa recursão
DROP POLICY IF EXISTS "Usuarios compartilham podem ver trabalho" ON public.work_in_progress;

-- Criar função security definer para verificar se usuário pode ver trabalho compartilhado
CREATE OR REPLACE FUNCTION public.can_view_shared_work(_user_id uuid, _work_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM work_shares ws
    JOIN profiles p ON p.email = ws.shared_with_email
    WHERE ws.work_id = _work_id
      AND p.id = _user_id
  )
$$;

-- Criar nova política usando a função
CREATE POLICY "Usuarios compartilhados podem ver trabalho"
ON public.work_in_progress
FOR SELECT
USING (public.can_view_shared_work(auth.uid(), id));