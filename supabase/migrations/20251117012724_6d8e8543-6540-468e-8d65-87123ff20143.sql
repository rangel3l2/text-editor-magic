-- Fix search_path for update_system_settings_timestamp function
-- First drop the trigger
DROP TRIGGER IF EXISTS update_system_settings_timestamp ON public.system_settings;

-- Then drop and recreate the function with proper search_path
DROP FUNCTION IF EXISTS public.update_system_settings_timestamp();

CREATE OR REPLACE FUNCTION public.update_system_settings_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_system_settings_timestamp
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_system_settings_timestamp();