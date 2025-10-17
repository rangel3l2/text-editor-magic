-- Create table for pending user roles (before user signs up)
CREATE TABLE IF NOT EXISTS public.pending_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(email, role)
);

-- Enable RLS on pending_user_roles
ALTER TABLE public.pending_user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage pending roles
CREATE POLICY "Admins can manage pending roles"
ON public.pending_user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user function to check for pending roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    is_admin_user boolean;
    pending_role app_role;
BEGIN
    -- Check if email is in admin list
    is_admin_user := NEW.email IN ('rangel.silva@estudante.ifms.edu.br', 'rangel3lband@gmail.com');
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (NEW.id, NEW.email, is_admin_user)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Insert role for admin users
    IF is_admin_user THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin'::public.app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        -- Check for pending roles
        FOR pending_role IN 
            SELECT role FROM public.pending_user_roles 
            WHERE email = NEW.email
        LOOP
            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.id, pending_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        END LOOP;
        
        -- Delete pending roles after applying them
        DELETE FROM public.pending_user_roles WHERE email = NEW.email;
        
        -- If no roles assigned, add default user role
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.id, 'user'::public.app_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;