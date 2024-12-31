import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export const useAdminStatus = (user: User | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["adminStatus", user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("No user provided to useAdminStatus");
        return false;
      }

      try {
        console.log("Checking admin status for:", {
          userId: user.id,
          email: user.email,
        });
        
        // First, try to get the profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking admin status:", error);
          
          // Profile doesn't exist
          if (error.code === "PGRST116") {
            console.log("Profile not found, attempting to create...");
            
            // Check if email is in admin list
            const isAdminEmail = ["rangel.silva@estudante.ifms.edu.br", "rangel3lband@gmail.com"].includes(user.email || "");
            console.log("Is admin email?", { email: user.email, isAdmin: isAdminEmail });
            
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  is_admin: isAdminEmail,
                },
              ])
              .select("is_admin")
              .maybeSingle();

            if (createError) {
              console.error("Error creating profile:", createError);
              toast({
                title: "Erro ao criar perfil",
                description: "Não foi possível criar seu perfil. Por favor, tente fazer logout e entrar novamente.",
                variant: "destructive",
              });
              return false;
            }

            console.log("New profile created:", newProfile);
            return newProfile?.is_admin || false;
          }

          // Handle unauthorized errors
          if (error.code === "PGRST401") {
            toast({
              title: "Sessão expirada",
              description: "Sua sessão expirou. Por favor, faça logout e entre novamente.",
              variant: "destructive",
            });
            return false;
          }

          // Handle forbidden errors
          if (error.code === "PGRST403") {
            toast({
              title: "Erro de permissão",
              description: "Você não tem permissão para acessar estas configurações.",
              variant: "destructive",
            });
            return false;
          }

          // Handle server errors
          toast({
            title: "Erro ao verificar permissões",
            description: "Ocorreu um erro ao verificar suas permissões. Por favor, tente novamente.",
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
          description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
        return false;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};