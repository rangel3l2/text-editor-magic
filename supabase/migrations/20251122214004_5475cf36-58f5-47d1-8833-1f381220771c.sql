-- Fix generate_work_share_token to avoid gen_random_bytes dependency
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
    -- Generate random token using md5 + clock_timestamp (no extensions needed)
    token := encode(digest(random()::text || clock_timestamp()::text, 'sha256'), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');

    -- Trim to 32 chars for shorter URLs
    token := substr(token, 1, 32);

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM work_in_progress WHERE share_token = token) INTO exists_token;

    -- Exit loop if token is unique
    EXIT WHEN NOT exists_token;
  END LOOP;

  RETURN token;
END;
$$;