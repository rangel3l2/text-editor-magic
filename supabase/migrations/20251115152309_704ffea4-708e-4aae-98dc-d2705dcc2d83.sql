-- Corrigir security warning: definir search_path nas funções existentes que não o possuem
-- Verificar e corrigir funções sem search_path definido

-- Função handle_new_user já tem SET search_path = 'public' implicitamente via SECURITY DEFINER
-- Mas vamos garantir explicitamente

-- Recriar a função update_work_last_modified com search_path explícito
CREATE OR REPLACE FUNCTION public.update_work_last_modified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.last_modified = now();
    RETURN NEW;
END;
$function$;