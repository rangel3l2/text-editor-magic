import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { ToastDescription } from "@/components/editor/ToastDescription";

export const useAdminStatus = (user: User | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("No user logged in");
        return false;
      }

      try {
        console.log("Checking admin status for user:", user.id);
        console.log("User email:", user.email);
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          
          if (error.message.includes('JWT')) {
            toast({
              title: "Erro de sessão",
              description: <ToastDescription message="Sua sessão expirou. Por favor, faça logout e entre novamente." />,
              variant: "destructive",
              duration: 5000,
            });
            return false;
          }
          
          // More specific error handling
          if (error.code === 'PGRST301') {
            toast({
              title: "Erro de permissão",
              description: <ToastDescription message="Você não tem permissão para acessar estas configurações." />,
              variant: "destructive",
              duration: 5000,
            });
            return false;
          }

          if (error.code === 'PGRST116') {
            toast({
              title: "Perfil não encontrado",
              description: <ToastDescription message="Seu perfil não foi encontrado. Por favor, faça logout e entre novamente." />,
              variant: "destructive",
              duration: 5000,
            });
            return false;
          }
          
          toast({
            title: "Erro ao verificar permissões",
            description: <ToastDescription message={`Ocorreu um erro ao verificar suas permissões. Detalhes: ${error.message}`} />,
            variant: "destructive",
            duration: 5000,
          });
          return false;
        }

        if (!profile) {
          console.log("No profile found for user:", user.id);
          toast({
            title: "Perfil não encontrado",
            description: <ToastDescription message="Seu perfil não foi encontrado. Por favor, faça logout e entre novamente." />,
            variant: "destructive",
            duration: 5000,
          });
          return false;
        }

        console.log("User profile:", profile);
        return profile?.is_admin || false;
      } catch (error) {
        console.error("Unexpected error in admin status check:", error);
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        
        toast({
          title: "Erro ao verificar permissões",
          description: <ToastDescription message="Ocorreu um erro inesperado. Por favor, tente novamente mais tarde." />,
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