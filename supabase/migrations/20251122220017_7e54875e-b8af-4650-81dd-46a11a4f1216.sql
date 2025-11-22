-- Permitir que usuários compartilhados visualizem trabalhos
CREATE POLICY "Usuarios compartilham podem ver trabalho"
ON public.work_in_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM work_shares ws
    JOIN profiles p ON p.email = ws.shared_with_email
    WHERE ws.work_id = work_in_progress.id
      AND p.id = auth.uid()
  )
);