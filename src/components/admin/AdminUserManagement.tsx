import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: profilesWithRoles, refetch } = useQuery({
    queryKey: ["profilesWithRoles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        throw profilesError;
      }

      // Fetch roles for each profile
      const profilesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .eq("role", "admin")
            .maybeSingle();

          return {
            ...profile,
            is_admin: !!roleData,
          };
        })
      );

      return profilesWithRoles;
    },
  });

  const handleAdminToggle = async (userId: string, currentValue: boolean) => {
    setUpdating(userId);
    
    try {
      if (!currentValue) {
        // Adding admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" as Database['public']['Enums']['app_role'] });

        if (error) throw error;
      } else {
        // Removing admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Status de administrador atualizado com sucesso",
      });

      refetch();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de administrador",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Admin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profilesWithRoles?.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
              <Switch
                checked={profile.is_admin}
                disabled={!!updating}
                onCheckedChange={() =>
                  handleAdminToggle(profile.id, profile.is_admin)
                }
              />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUserManagement;