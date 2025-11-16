-- Update banner template presets to remove FeciTEL references
UPDATE banner_template_presets
SET 
  description = CASE 
    WHEN description LIKE '%FeciTEL%' OR description LIKE '%fecitel%' THEN 
      REPLACE(REPLACE(description, 'FeciTEL', ''), 'fecitel', '')
    ELSE description
  END,
  name = CASE
    WHEN name LIKE '%FeciTEL%' THEN REPLACE(name, 'FeciTEL', 'Layout')
    WHEN name LIKE '%fecitel%' THEN REPLACE(name, 'fecitel', 'layout')
    ELSE name
  END
WHERE is_active = true;