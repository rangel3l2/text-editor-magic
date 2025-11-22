-- Fix infinite recursion error in RLS for work_in_progress by simplifying policies

-- Drop complex collaborator policies that may cause recursion
DROP POLICY IF EXISTS "Colaboradores podem ver trabalhos compartilhados" ON public.work_in_progress;
DROP POLICY IF EXISTS "Editores podem atualizar trabalhos compartilhados" ON public.work_in_progress;

-- Ensure basic owner and admin policies exist and are safe
DO $$
BEGIN
  -- Admins can view all work
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'work_in_progress' 
      AND policyname = 'Admins can view all work'
  ) THEN
    CREATE POLICY "Admins can view all work" ON public.work_in_progress
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'));
  END IF;

  -- Users can view their own work
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'work_in_progress' 
      AND policyname = 'Users can view their own work'
  ) THEN
    CREATE POLICY "Users can view their own work" ON public.work_in_progress
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own work
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'work_in_progress' 
      AND policyname = 'Users can insert their own work'
  ) THEN
    CREATE POLICY "Users can insert their own work" ON public.work_in_progress
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own work
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'work_in_progress' 
      AND policyname = 'Users can update their own work'
  ) THEN
    CREATE POLICY "Users can update their own work" ON public.work_in_progress
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own work
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'work_in_progress' 
      AND policyname = 'Users can delete their own work'
  ) THEN
    CREATE POLICY "Users can delete their own work" ON public.work_in_progress
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;