import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

export const useAdminStatus = (user: User | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("Nenhum usuário logado");
        return false;
      }

      try {
        console.log("Verificando status de admin para usuário:", user.id);
        
        // Aguardar um momento para garantir que a sessão está pronta
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar o status de admin
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erro ao verificar status de admin:", error);
          
          // Não mostrar toast para erros de JWT pois são esperados durante a inicialização
          if (!error.message.includes('JWT')) {
            toast({
              title: "Erro ao verificar permissões",
              description: "Por favor, faça logout e tente novamente.",
              variant: "destructive",
            });
          }
          return false;
        }

        console.log("Perfil do usuário:", profile);
        return profile?.is_admin || false;
      } catch (error) {
        console.error("Erro na verificação de status de admin:", error);
        return false;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 60000, // Manter no cache por 1 minuto
  });
};