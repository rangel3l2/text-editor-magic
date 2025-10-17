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
import { useAuth } from "@/contexts/AuthContext";

const AdminUserManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);

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

      // Check if current user is admin
      if (user) {
        const { data: currentUserRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setCurrentUserIsAdmin(!!currentUserRole);
      }

      // Fetch roles for each profile
      const profilesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          const isAdmin = roles?.some(r => r.role === "admin") || false;
          const isModerator = roles?.some(r => r.role === "moderator") || false;

          return {
            ...profile,
            is_admin: isAdmin,
            is_moderator: isModerator,
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

  const handleModeratorToggle = async (userId: string, currentValue: boolean, isAdmin: boolean) => {
    // Moderators cannot remove admin role
    if (isAdmin && !currentUserIsAdmin) {
      toast({
        title: "Erro",
        description: "Moderadores não podem alterar permissões de administradores",
        variant: "destructive",
      });
      return;
    }

    setUpdating(userId);
    
    try {
      if (!currentValue) {
        // Adding moderator role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "moderator" as Database['public']['Enums']['app_role'] });

        if (error) throw error;
      } else {
        // Removing moderator role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "moderator");

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Status de moderador atualizado com sucesso",
      });

      refetch();
    } catch (error) {
      console.error("Error updating moderator status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de moderador",
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
            <TableHead>Moderador</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profilesWithRoles?.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
                <Switch
                  checked={profile.is_admin}
                  disabled={!!updating || (!currentUserIsAdmin && profile.is_admin)}
                  onCheckedChange={() =>
                    handleAdminToggle(profile.id, profile.is_admin)
                  }
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={profile.is_moderator}
                  disabled={!!updating || (!currentUserIsAdmin && profile.is_admin)}
                  onCheckedChange={() =>
                    handleModeratorToggle(profile.id, profile.is_moderator, profile.is_admin)
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