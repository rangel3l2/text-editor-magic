-- Fix security warnings: Add search_path to functions
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS update_banner_work_images_updated_at_trigger ON public.banner_work_images;
DROP FUNCTION IF EXISTS public.update_banner_work_images_updated_at();

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION public.update_banner_work_images_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_banner_work_images_updated_at_trigger
BEFORE UPDATE ON public.banner_work_images
FOR EACH ROW
EXECUTE FUNCTION public.update_banner_work_images_updated_at();