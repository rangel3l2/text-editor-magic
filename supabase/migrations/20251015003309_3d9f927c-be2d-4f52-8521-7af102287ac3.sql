-- Fix RLS policies for profiles table to prevent email exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Allow users to read only their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow admins to read all profiles (requires admin check)
CREATE POLICY "Admins can read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (is_admin = true AND auth.uid() = id);
