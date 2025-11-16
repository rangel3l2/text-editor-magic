-- Corrigir search_path da função generate_share_token
DROP FUNCTION IF EXISTS generate_share_token();

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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