import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
        console.log("Checking admin status for user:", {
          userId: user.id,
          email: user.email,
          session: await supabase.auth.getSession()
        });
        
        // First, try to get the profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking admin status:", {
            error,
            code: error.code,
            details: error.details,
            hint: error.hint,
            userId: user.id,
            email: user.email
          });

          // If profile doesn't exist, create it
          if (error.code === "PGRST116" || error.status === 404) {
            console.log("Profile not found, attempting to create...");
            
            const isAdminEmail = ["rangel.silva@estudante.ifms.edu.br", "rangel3lband@gmail.com"].includes(user.email || "");
            console.log("Is admin email?", { email: user.email, isAdmin: isAdminEmail });

            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                is_admin: isAdminEmail
              })
              .select("is_admin")
              .single();

            if (insertError) {
              console.error("Error creating profile:", {
                error: insertError,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint
              });
              
              toast({
                title: "Erro ao criar perfil",
                description: <ToastDescription message="Não foi possível criar seu perfil. Por favor, tente fazer logout e entrar novamente." />,
                variant: "destructive",
              });
              return false;
            }

            console.log("New profile created:", newProfile);
            return newProfile?.is_admin || false;
          }

          // Handle session errors
          if (error.message?.includes('JWT') || error.status === 401) {
            toast({
              title: "Sessão expirada",
              description: <ToastDescription message="Sua sessão expirou. Por favor, faça logout e entre novamente." />,
              variant: "destructive",
            });
            return false;
          }

          // Handle permission errors
          if (error.code === "PGRST301" || error.status === 403) {
            toast({
              title: "Erro de permissão",
              description: <ToastDescription message="Você não tem permissão para acessar estas configurações." />,
              variant: "destructive",
            });
            return false;
          }

          // Handle server errors
          if (error.status === 500) {
            toast({
              title: "Erro no servidor",
              description: <ToastDescription message="Ocorreu um erro no servidor. Por favor, tente novamente em alguns instantes." />,
              variant: "destructive",
            });
            return false;
          }

          // Generic error
          toast({
            title: "Erro ao verificar permissões",
            description: <ToastDescription message="Ocorreu um erro ao verificar suas permissões. Por favor, tente novamente." />,
            variant: "destructive",
          });
          return false;
        }

        console.log("Profile found:", profile);
        return profile?.is_admin || false;
      } catch (error) {
        console.error("Unexpected error in admin status check:", error);
        toast({
          title: "Erro inesperado",
          description: <ToastDescription message="Ocorreu um erro inesperado. Por favor, tente novamente mais tarde." />,
          variant: "destructive",
        });
        return false;
      }
    },
    enabled: !!user,
    retry: 1,
    retryDelay: 2000,
    staleTime: 30000,
    gcTime: 60000,
  });
};