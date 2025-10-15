-- Fix Security Issues: Banner Templates, Storage Bucket, and Admin Roles

-- 1. Remove overly permissive banner_templates policy
DROP POLICY IF EXISTS "Allow read access to all users" ON public.banner_templates;

-- 2. Create proper owner-only read policy for banner_templates
CREATE POLICY "Users can only read their own banner templates"
    ON public.banner_templates
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Fix storage bucket - make it private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'banner_images';

-- 4. Drop existing storage policies
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to insert their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;

-- 5. Create proper storage policies with user verification
CREATE POLICY "Users can view their own banner images"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'banner_images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload their own banner images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'banner_images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own banner images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'banner_images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own banner images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'banner_images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. Create app_role enum for proper role management
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 7. Create user_roles table with proper architecture
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 8. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 10. Migrate existing admin data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 11. Insert default 'user' role for all existing users who aren't admins
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role
FROM public.profiles
WHERE is_admin = false OR is_admin IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 12. Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- 13. Update profiles RLS policies to use the new has_role function
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles using role function"
    ON public.profiles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- 14. Update academic_work_types policies to use new role function
DROP POLICY IF EXISTS "Admins can manage work types" ON public.academic_work_types;

CREATE POLICY "Admins can manage work types using role function"
    ON public.academic_work_types
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- 15. Update system_logs policies to use new role function
DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;

CREATE POLICY "Admins can view all logs using role function"
    ON public.system_logs
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- 16. Update handle_new_user function to use user_roles instead of is_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin_user boolean;
BEGIN
    -- Check if email is in admin list
    is_admin_user := NEW.email IN ('rangel.silva@estudante.ifms.edu.br', 'rangel3lband@gmail.com');
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (NEW.id, NEW.email, is_admin_user)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Insert role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id, 
        CASE WHEN is_admin_user THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;