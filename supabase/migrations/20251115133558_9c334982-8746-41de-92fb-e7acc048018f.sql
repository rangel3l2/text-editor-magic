-- Create table for banner images metadata
CREATE TABLE IF NOT EXISTS public.banner_work_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES public.work_in_progress(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  column_position INTEGER CHECK (column_position IN (1, 2, 3)),
  width_cm DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  crop_data JSONB,
  rotation INTEGER DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
  adjustments JSONB DEFAULT '{"brightness": 0, "contrast": 0, "saturation": 0}'::jsonb,
  original_width INTEGER,
  original_height INTEGER,
  dpi INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banner_work_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banner_work_images
CREATE POLICY "Users can view their own banner work images"
ON public.banner_work_images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banner work images"
ON public.banner_work_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banner work images"
ON public.banner_work_images
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banner work images"
ON public.banner_work_images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_banner_work_images_work_id ON public.banner_work_images(work_id);
CREATE INDEX idx_banner_work_images_user_id ON public.banner_work_images(user_id);
CREATE INDEX idx_banner_work_images_display_order ON public.banner_work_images(work_id, display_order);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_banner_work_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_banner_work_images_updated_at_trigger
BEFORE UPDATE ON public.banner_work_images
FOR EACH ROW
EXECUTE FUNCTION public.update_banner_work_images_updated_at();