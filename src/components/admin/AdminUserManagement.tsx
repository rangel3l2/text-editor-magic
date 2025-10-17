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
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

const AdminUserManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [isAddModeratorOpen, setIsAddModeratorOpen] = useState(false);
  const [newModeratorEmail, setNewModeratorEmail] = useState("");
  const [isAddingModerator, setIsAddingModerator] = useState(false);

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

  const handleAddModerator = async () => {
    if (!newModeratorEmail.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      });
      return;
    }

    setIsAddingModerator(true);

    try {
      // First, find the user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newModeratorEmail.trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado. O usuário deve estar cadastrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a moderator
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .eq("role", "moderator")
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Aviso",
          description: "Este usuário já é um moderador",
          variant: "destructive",
        });
        return;
      }

      // Add moderator role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: profile.id, 
          role: "moderator" as Database['public']['Enums']['app_role'] 
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Moderador adicionado com sucesso",
      });

      setNewModeratorEmail("");
      setIsAddModeratorOpen(false);
      refetch();
    } catch (error) {
      console.error("Error adding moderator:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o moderador",
        variant: "destructive",
      });
    } finally {
      setIsAddingModerator(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentUserIsAdmin && (
        <div className="flex justify-end">
          <Dialog open={isAddModeratorOpen} onOpenChange={setIsAddModeratorOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Moderador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Moderador</DialogTitle>
                <DialogDescription>
                  Insira o email de um usuário cadastrado para torná-lo moderador do sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="moderator-email">Email do Usuário</Label>
                  <Input
                    id="moderator-email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={newModeratorEmail}
                    onChange={(e) => setNewModeratorEmail(e.target.value)}
                    disabled={isAddingModerator}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddModeratorOpen(false)}
                    disabled={isAddingModerator}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddModerator} disabled={isAddingModerator}>
                    {isAddingModerator ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
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