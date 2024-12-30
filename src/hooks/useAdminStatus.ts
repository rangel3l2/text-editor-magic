import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

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
        console.log("Checking admin status for:", {
          userId: user.id,
          email: user.email
        });

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", {
            error,
            userId: user.id,
            email: user.email
          });

          // Handle specific error cases
          if (error.code === "PGRST116") {
            console.log("Profile not found, creating new profile...");
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                is_admin: ["rangel.silva@estudante.ifms.edu.br", "rangel3lband@gmail.com"].includes(user.email || "")
              });

            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast({
                title: "Erro ao criar perfil",
                description: "Por favor, faça logout e entre novamente.",
                variant: "destructive",
              });
              return false;
            }

            // Retry fetching the profile
            const { data: newProfile, error: refetchError } = await supabase
              .from("profiles")
              .select("is_admin")
              .eq("id", user.id)
              .single();

            if (refetchError) {
              console.error("Error refetching profile:", refetchError);
              return false;
            }

            return newProfile?.is_admin || false;
          }

          if (error.code === "PGRST301") {
            toast({
              title: "Erro de permissão",
              description: "Você não tem permissão para acessar estas configurações.",
              variant: "destructive",
            });
            return false;
          }

          toast({
            title: "Erro ao verificar permissões",
            description: "Por favor, tente novamente mais tarde.",
            variant: "destructive",
          });
          return false;
        }

        console.log("Admin status result:", {
          userId: user.id,
          email: user.email,
          isAdmin: profile?.is_admin
        });

        return profile?.is_admin || false;
      } catch (error) {
        console.error("Unexpected error in admin status check:", error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
          variant: "destructive",
        });
        return false;
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // Cache the result for 30 seconds
    gcTime: 60000, // Keep the cache for 1 minute
  });
};