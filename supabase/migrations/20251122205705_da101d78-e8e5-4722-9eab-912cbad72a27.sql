-- Adicionar campo share_token à tabela work_in_progress
ALTER TABLE work_in_progress ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

-- Criar tipo enum para níveis de permissão (apenas se não existir)
DO $$ BEGIN
  CREATE TYPE share_permission AS ENUM ('viewer', 'editor', 'commenter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela para compartilhamentos de trabalhos
CREATE TABLE IF NOT EXISTS work_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES work_in_progress(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_with_email text NOT NULL,
  permission share_permission NOT NULL DEFAULT 'viewer',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(work_id, shared_with_email)
);

-- Criar tabela para comentários nas seções
CREATE TABLE IF NOT EXISTS work_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES work_in_progress(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE work_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_comments ENABLE ROW LEVEL SECURITY;

-- Policies para work_shares
CREATE POLICY "Usuários podem ver compartilhamentos dos seus trabalhos"
  ON work_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_in_progress 
      WHERE work_in_progress.id = work_shares.work_id 
      AND work_in_progress.user_id = auth.uid()
    )
  );

CREATE POLICY "Donos podem criar compartilhamentos"
  ON work_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_in_progress 
      WHERE work_in_progress.id = work_shares.work_id 
      AND work_in_progress.user_id = auth.uid()
    ) AND shared_by = auth.uid()
  );

CREATE POLICY "Donos podem atualizar compartilhamentos"
  ON work_shares FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM work_in_progress 
      WHERE work_in_progress.id = work_shares.work_id 
      AND work_in_progress.user_id = auth.uid()
    )
  );

CREATE POLICY "Donos podem deletar compartilhamentos"
  ON work_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM work_in_progress 
      WHERE work_in_progress.id = work_shares.work_id 
      AND work_in_progress.user_id = auth.uid()
    )
  );

-- Policy para colaboradores verem trabalhos compartilhados com eles
CREATE POLICY "Colaboradores podem ver trabalhos compartilhados"
  ON work_in_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_shares ws
      JOIN profiles p ON p.email = ws.shared_with_email
      WHERE ws.work_id = work_in_progress.id 
      AND p.id = auth.uid()
    )
  );

-- Policy para editores atualizarem trabalhos compartilhados
CREATE POLICY "Editores podem atualizar trabalhos compartilhados"
  ON work_in_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM work_shares ws
      JOIN profiles p ON p.email = ws.shared_with_email
      WHERE ws.work_id = work_in_progress.id 
      AND p.id = auth.uid()
      AND ws.permission = 'editor'
    )
  );

-- Policies para work_comments
CREATE POLICY "Usuários podem ver comentários dos trabalhos que têm acesso"
  ON work_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_in_progress 
      WHERE work_in_progress.id = work_comments.work_id 
      AND work_in_progress.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM work_shares ws
      JOIN profiles p ON p.email = ws.shared_with_email
      WHERE ws.work_id = work_comments.work_id 
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Comentadores e editores podem criar comentários"
  ON work_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM work_shares ws
        JOIN profiles p ON p.email = ws.shared_with_email
        WHERE ws.work_id = work_comments.work_id 
        AND p.id = auth.uid()
        AND ws.permission IN ('commenter', 'editor')
      )
      OR
      EXISTS (
        SELECT 1 FROM work_in_progress 
        WHERE work_in_progress.id = work_comments.work_id 
        AND work_in_progress.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON work_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios comentários ou donos podem deletar qualquer comentário"
  ON work_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM work_in_progress 
      WHERE work_in_progress.id = work_comments.work_id 
      AND work_in_progress.user_id = auth.uid()
    )
  );

-- Função para gerar share token único
CREATE OR REPLACE FUNCTION generate_work_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token text;
  exists_token boolean;
BEGIN
  LOOP
    token := encode(gen_random_bytes(16), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    
    SELECT EXISTS(SELECT 1 FROM work_in_progress WHERE share_token = token) INTO exists_token;
    
    EXIT WHEN NOT exists_token;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Habilitar realtime para sincronização em tempo real (apenas novas tabelas)
ALTER PUBLICATION supabase_realtime ADD TABLE work_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE work_shares;