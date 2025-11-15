-- Tornar o bucket banner_images público para leitura
UPDATE storage.buckets 
SET public = true 
WHERE id = 'banner_images';