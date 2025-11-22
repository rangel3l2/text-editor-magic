-- Simplify generate_work_share_token to avoid missing extensions
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
    -- Generate random token using only built-in md5 and random
    token := md5(random()::text || clock_timestamp()::text);

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM work_in_progress WHERE share_token = token) INTO exists_token;

    -- Exit loop if token is unique
    EXIT WHEN NOT exists_token;
  END LOOP;

  RETURN token;
END;
$$;