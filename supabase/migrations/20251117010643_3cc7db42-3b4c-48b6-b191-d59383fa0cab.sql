-- Add image_type and source fields to banner_work_images
ALTER TABLE banner_work_images 
ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'figura' CHECK (image_type IN ('figura', 'grafico', 'tabela')),
ADD COLUMN IF NOT EXISTS source TEXT;