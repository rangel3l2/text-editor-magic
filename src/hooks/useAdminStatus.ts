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
        return false;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking admin status:", error);
          throw error;
        }

        return profile?.is_admin || false;
      } catch (error) {
        console.error("Error in admin status check:", error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return false;
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // Cache por 30 segundos
    cacheTime: 60000, // Manter no cache por 1 minuto
  });
};