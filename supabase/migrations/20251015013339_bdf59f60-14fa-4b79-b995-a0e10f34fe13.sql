
-- Remove duplicate work types, keeping only the most recent one of each
DELETE FROM academic_work_types 
WHERE id IN (
  '111a76f7-5bd1-4037-a8e8-95cbb2bf4e2f', -- Artigo Científico (older)
  '3d395d5d-96f1-4691-b4eb-fd6b35e4e4f0', -- Banner Acadêmico (older)
  '8313eedf-1ded-4b1e-8dec-0e88afbcb015', -- Monografia (older)
  '134b3fd3-d27e-4296-a675-cf53f94e77dc', -- Projeto de Pesquisa (older)
  'a4ce0d61-3b03-4990-8017-7ba28491f1d5', -- Tese/Dissertação (older)
  'db844014-6698-4137-b9f1-0751a677796f'  -- Tcc (old entry to remove)
);
