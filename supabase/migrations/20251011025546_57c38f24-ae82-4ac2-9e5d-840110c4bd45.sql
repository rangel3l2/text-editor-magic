-- Tabela de tipos de trabalhos acadêmicos
CREATE TABLE IF NOT EXISTS public.academic_work_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela de templates de banners
CREATE TABLE IF NOT EXISTS public.banner_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    latex_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de imagens de banners
CREATE TABLE IF NOT EXISTS public.banner_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    banner_id UUID REFERENCES public.banner_templates(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    crop_data JSONB,
    aspect_ratio TEXT,
    position_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id)
);

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    has_seen_tutorial BOOLEAN DEFAULT false,
    cookie_consent BOOLEAN DEFAULT false,
    cookie_consent_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de trabalhos em progresso
CREATE TABLE IF NOT EXISTS public.work_in_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Trabalho sem título' NOT NULL,
    work_type TEXT NOT NULL,
    content JSONB,
    last_modified TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (
        new.id,
        new.email,
        CASE 
            WHEN new.email IN ('rangel.silva@estudante.ifms.edu.br', 'rangel3lband@gmail.com') 
            THEN true 
            ELSE false 
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        is_admin = CASE 
            WHEN EXCLUDED.email IN ('rangel.silva@estudante.ifms.edu.br', 'rangel3lband@gmail.com') 
            THEN true 
            ELSE profiles.is_admin 
        END;
    RETURN new;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar timestamp de última modificação
CREATE OR REPLACE FUNCTION public.update_work_last_modified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_modified = now();
    RETURN NEW;
END;
$$;

-- Trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS update_work_last_modified ON public.work_in_progress;
CREATE TRIGGER update_work_last_modified
    BEFORE UPDATE ON public.work_in_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_work_last_modified();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.academic_work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_in_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para academic_work_types
CREATE POLICY "Anyone can view active work types"
    ON public.academic_work_types
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage work types"
    ON public.academic_work_types
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Políticas RLS para banner_templates
CREATE POLICY "Allow read access to all users"
    ON public.banner_templates
    FOR SELECT
    USING (true);

CREATE POLICY "Allow full access to owner"
    ON public.banner_templates
    USING (auth.uid() = user_id);

-- Políticas RLS para banner_images
CREATE POLICY "Allow public to view images"
    ON public.banner_images
    FOR SELECT
    USING (true);

CREATE POLICY "Allow users to insert their own images"
    ON public.banner_images
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own images"
    ON public.banner_images
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own images"
    ON public.banner_images
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow full access to banner owner"
    ON public.banner_images
    USING (
        EXISTS (
            SELECT 1 FROM public.banner_templates
            WHERE banner_templates.id = banner_images.banner_id 
            AND banner_templates.user_id = auth.uid()
        )
    );

-- Políticas RLS para profiles
CREATE POLICY "Anyone can read profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authentication only"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Políticas RLS para system_logs
CREATE POLICY "Users can insert logs"
    ON public.system_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = performed_by);

CREATE POLICY "Admins can view all logs"
    ON public.system_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Políticas RLS para user_preferences
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas RLS para work_in_progress
CREATE POLICY "Users can view their own work"
    ON public.work_in_progress
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work"
    ON public.work_in_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work"
    ON public.work_in_progress
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work"
    ON public.work_in_progress
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Criar bucket de storage para imagens de banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner_images', 'banner_images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para banner_images
CREATE POLICY "Allow public downloads"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'banner_images');

CREATE POLICY "Allow authenticated uploads"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'banner_images' AND auth.role() = 'authenticated');

-- Habilitar realtime para work_in_progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_in_progress;