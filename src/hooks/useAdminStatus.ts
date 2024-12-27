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
        
        // Primeiro, verificar se o perfil existe
        const { data: profileExists, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Erro ao verificar existência do perfil:", checkError);
          return false;
        }

        if (!profileExists) {
          console.log("Perfil não encontrado, criando novo perfil...");
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              { 
                id: user.id,
                email: user.email,
                is_admin: user.email === 'rangel.silva@estudante.ifms.edu.br' || 
                         user.email === 'rangel3lband@gmail.com'
              }
            ]);

          if (insertError) {
            console.error("Erro ao criar perfil:", insertError);
            return false;
          }
        }

        // Agora verificar o status de admin
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
              description: "Tente novamente em alguns instantes.",
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
    retry: 1,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 60000, // Manter no cache por 1 minuto
  });
};