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
        console.log("Checking admin status for user:", {
          userId: user.id,
          email: user.email,
        });
        
        // First try to get the profile directly
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          
          // If profile doesn't exist, create it
          if (error.code === "PGRST116") {
            console.log("Profile not found, creating new profile...");
            
            const isAdminEmail = [
              "rangel.silva@estudante.ifms.edu.br",
              "rangel3lband@gmail.com"
            ].includes(user.email || "");
            
            console.log("Creating profile with admin status:", {
              email: user.email,
              isAdmin: isAdminEmail
            });

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  is_admin: isAdminEmail,
                }
              ])
              .select("is_admin")
              .limit(1)
              .maybeSingle();

            if (createError) {
              console.error("Error creating profile:", createError);
              toast({
                title: "Erro ao criar perfil",
                description: "Por favor, tente fazer logout e entrar novamente.",
                variant: "destructive",
              });
              return false;
            }

            console.log("New profile created successfully:", newProfile);
            return newProfile?.is_admin || false;
          }

          // Handle authentication errors
          if (error.code === "PGRST401") {
            console.error("Authentication error:", error);
            toast({
              title: "Sessão expirada",
              description: "Por favor, faça logout e entre novamente.",
              variant: "destructive",
            });
            return false;
          }

          // Handle other errors
          console.error("Unexpected error:", error);
          toast({
            title: "Erro ao verificar permissões",
            description: "Tente novamente mais tarde.",
            variant: "destructive",
          });
          return false;
        }

        console.log("Profile found:", profile);
        return profile?.is_admin || false;
      } catch (error) {
        console.error("Unexpected error in useAdminStatus:", error);
        toast({
          title: "Erro inesperado",
          description: "Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
        return false;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};