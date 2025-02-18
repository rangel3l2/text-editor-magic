import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Update the hook's signature to accept a second (optional) parameter.
export const useAdminStatus = (user: any, options: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) {
        console.error("No user provided to useAdminStatus");
        return false;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return data?.is_admin || false;
    },
    enabled: !!user,
    ...options,
  });
};
// ...existing code...
