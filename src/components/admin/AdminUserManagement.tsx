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

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const { data: profiles, refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      return data;
    },
  });

  const handleAdminToggle = async (userId: string, currentValue: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !currentValue })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissões de administrador atualizadas com sucesso.",
      });
      refetch();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissões de administrador.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
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
          {profiles?.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
                <Switch
                  checked={profile.is_admin}
                  disabled={updating}
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