
-- Update the name of the academic work type from "Projeto de Intervenção" to "Projeto de Pesquisa"
UPDATE academic_work_types 
SET name = 'Projeto de Pesquisa',
    description = 'Proposta de pesquisa acadêmica em contexto específico',
    updated_at = now()
WHERE name = 'Projeto de Intervenção';
