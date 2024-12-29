import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Copy } from "lucide-react";

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
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", error);
          
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
            description: "Ocorreu um erro ao verificar suas permissões. Tente novamente mais tarde.",
            variant: "destructive",
            duration: 5000,
          });
          return false;
        }

        console.log("User profile:", profile);
        return profile?.is_admin || false;
      } catch (error) {
        console.error("Error in admin status check:", error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Por favor, faça logout e entre novamente na sua conta.",
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