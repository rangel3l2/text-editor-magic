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
        console.log("No user logged in");
        return false;
      }

      try {
        console.log("Checking admin status for user:", user.id);
        
        // Wait for session to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", error);
          
          // Only show toast for non-JWT errors
          if (!error.message.includes('JWT')) {
            toast({
              title: "Erro de permissões",
              description: "Por favor, faça logout e entre novamente na sua conta.",
              variant: "destructive",
              duration: 5000,
            });
          }
          return false;
        }

        console.log("User profile:", profile);
        return profile?.is_admin || false;
      } catch (error) {
        console.error("Error in admin status check:", error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Por favor, tente novamente mais tarde.",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 2000,
    staleTime: 30000,
    gcTime: 60000,
  });
};