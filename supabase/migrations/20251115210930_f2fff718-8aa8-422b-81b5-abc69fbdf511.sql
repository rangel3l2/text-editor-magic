-- Update banner template presets to remove IFMS references and use generic descriptions
UPDATE banner_template_presets
SET 
  name = CASE 
    WHEN name LIKE '%IFMS%' THEN REPLACE(name, 'IFMS - ', '')
    ELSE name
  END,
  description = CASE 
    WHEN id = (SELECT id FROM banner_template_presets ORDER BY created_at LIMIT 1 OFFSET 0) 
      THEN 'Template com layout de 2 colunas, ideal para apresentações simples e diretas'
    WHEN id = (SELECT id FROM banner_template_presets ORDER BY created_at LIMIT 1 OFFSET 1) 
      THEN 'Template com layout de 3 colunas, perfeito para apresentações com múltiplas seções'
    ELSE description
  END
WHERE is_active = true;