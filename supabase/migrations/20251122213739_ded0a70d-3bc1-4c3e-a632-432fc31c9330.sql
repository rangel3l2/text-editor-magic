-- Ensure generate_work_share_token is exposed to RPC (must be STABLE)
CREATE OR REPLACE FUNCTION public.generate_work_share_token()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
  exists_token boolean;
BEGIN
  LOOP
    -- Generate random token
    token := encode(gen_random_bytes(16), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM work_in_progress WHERE share_token = token) INTO exists_token;

    -- Exit loop if token is unique
    EXIT WHEN NOT exists_token;
  END LOOP;

  RETURN token;
END;
$$;