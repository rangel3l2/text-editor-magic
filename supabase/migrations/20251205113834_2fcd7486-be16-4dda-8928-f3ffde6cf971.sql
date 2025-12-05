-- 1. Remover política RLS muito permissiva da tabela banner_images
DROP POLICY IF EXISTS "Allow public to view images" ON public.banner_images;

-- 2. Adicionar política que permite ver apenas imagens próprias ou de banners públicos
CREATE POLICY "Users can view own images or public banner images" 
ON public.banner_images 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.banner_templates 
    WHERE banner_templates.id = banner_images.banner_id 
    AND (banner_templates.user_id = auth.uid() OR banner_templates.is_public = true)
  )
);

-- 3. Tornar o bucket de storage privado
UPDATE storage.buckets 
SET public = false 
WHERE id = 'banner_images';

-- 4. Remover políticas de storage existentes para banner_images
DROP POLICY IF EXISTS "Allow public to view banner images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their banner images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their banner images" ON storage.objects;

-- 5. Criar políticas de storage seguras
CREATE POLICY "Authenticated users can view own banner images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'banner_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banner_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update own banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banner_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete own banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banner_images' AND auth.uid()::text = (storage.foldername(name))[1]);