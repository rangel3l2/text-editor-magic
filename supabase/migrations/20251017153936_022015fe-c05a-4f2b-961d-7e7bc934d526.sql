-- Update search function to exclude banners
CREATE OR REPLACE FUNCTION public.search_works_by_title(
  p_user_id uuid,
  p_search_term text
)
RETURNS TABLE (
  id uuid,
  title text,
  work_type text,
  last_modified timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.id,
    w.title,
    w.work_type,
    w.last_modified
  FROM work_in_progress w
  WHERE w.user_id = p_user_id
    AND w.work_type != 'banner'
    AND unaccent(lower(w.title)) LIKE unaccent(lower('%' || p_search_term || '%'))
  ORDER BY w.last_modified DESC;
$$;