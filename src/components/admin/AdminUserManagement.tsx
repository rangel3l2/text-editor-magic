import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
}

const AdminUserManagement = () => {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_admin", true);

      if (error) {
        console.error("Error fetching admin users:", error);
        throw error;
      }

      return data as AdminUser[];
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      if (userError) {
        throw new Error("Usuário não encontrado");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", userData.id);

      if (updateError) {
        throw updateError;
      }

      return userData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({
        title: "Sucesso",
        description: "Administrador adicionado com sucesso",
      });
      setNewAdminEmail("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar administrador",
        variant: "destructive",
      });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: false })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({
        title: "Sucesso",
        description: "Administrador removido com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover administrador",
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminEmail) {
      addAdminMutation.mutate(newAdminEmail);
    }
  };

  const handleRemoveAdmin = (userId: string) => {
    removeAdminMutation.mutate(userId);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddAdmin} className="flex gap-4">
        <Input
          type="email"
          placeholder="Email do novo administrador"
          value={newAdminEmail}
          onChange={(e) => setNewAdminEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={addAdminMutation.isPending}>
          Adicionar Admin
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminUsers?.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveAdmin(admin.id)}
                  disabled={removeAdminMutation.isPending}
                >
                  Remover
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUserManagement;