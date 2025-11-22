-- Corrigir função para adicionar search_path por segurança
CREATE OR REPLACE FUNCTION generate_work_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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