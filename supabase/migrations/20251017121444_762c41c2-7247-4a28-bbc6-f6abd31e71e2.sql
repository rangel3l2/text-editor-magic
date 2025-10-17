-- Function to check if a user can manage another user's roles
CREATE OR REPLACE FUNCTION public.can_manage_user_role(
  _manager_id uuid,
  _target_user_id uuid,
  _target_role app_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can manage anyone
  IF has_role(_manager_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Moderators can manage users and other moderators, but not admins
  IF has_role(_manager_id, 'moderator'::app_role) AND _target_role != 'admin'::app_role THEN
    -- Also check that the target user is not an admin
    IF NOT has_role(_target_user_id, 'admin'::app_role) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Update RLS policies for user_roles table
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Policy for viewing roles (admins and moderators can view all)
CREATE POLICY "Admins and moderators can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Policy for inserting roles (admins and moderators, with restrictions)
CREATE POLICY "Admins and moderators can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  can_manage_user_role(auth.uid(), user_id, role)
);

-- Policy for deleting roles (admins and moderators, with restrictions)
CREATE POLICY "Admins and moderators can delete roles"
ON public.user_roles
FOR DELETE
USING (
  can_manage_user_role(auth.uid(), user_id, role)
);

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Admins can read all profiles using role function" ON public.profiles;

CREATE POLICY "Admins and moderators can read all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Update RLS policies for academic_work_types
DROP POLICY IF EXISTS "Admins can manage work types using role function" ON public.academic_work_types;

CREATE POLICY "Admins and moderators can manage work types"
ON public.academic_work_types
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Update RLS policies for system_logs
DROP POLICY IF EXISTS "Admins can view all logs using role function" ON public.system_logs;

CREATE POLICY "Admins and moderators can view all logs"
ON public.system_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);