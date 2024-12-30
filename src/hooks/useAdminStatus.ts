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
          console.error("Error checking admin status:", {
            error,
            userId: user.id,
            email: user.email
          });
          
          if (error.message.includes('JWT')) {
            toast({
              title: "Erro de sessão",
              description: "Sua sessão expirou. Por favor, faça logout e entre novamente.",
              variant: "destructive",
              duration: 5000,
            });
            return false;
          }
          
          toast({
            title: "Erro ao verificar permissões",
            description: "Por favor, tente novamente mais tarde.",
            variant: "destructive",
            duration: 5000,
          });
          return false;
        }

        if (!profile) {
          console.log("No profile found for user:", {
            userId: user.id,
            email: user.email
          });
          
          // Instead of showing an error, we'll just return false
          // This handles the case where the profile might not be created yet
          return false;
        }

        return profile.is_admin || false;
      } catch (error) {
        console.error("Unexpected error in admin status check:", error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
    },
    enabled: !!user,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000,
    gcTime: 60000,
  });
};