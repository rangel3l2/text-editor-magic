import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

const AcademicWorkTypeManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [updating, setUpdating] = useState(false);

  const { data: workTypes, isLoading, refetch } = useQuery({
    queryKey: ["academicWorkTypes", "admin"],
    queryFn: async () => {
      console.log("Fetching work types...");
      const { data, error } = await supabase
        .from("academic_work_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching work types:", error);
        throw error;
      }

      console.log("Work types fetched:", data);
      return data;
    },
  });

  const handleAddWorkType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name) {
      toast({
        title: "Erro",
        description: "O nome do tipo de trabalho é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: workType, error } = await supabase
        .from("academic_work_types")
        .insert([
          {
            name: newType.name,
            description: newType.description,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await supabase.from("system_logs").insert([
        {
          action: "CREATE",
          entity_type: "academic_work_types",
          entity_id: workType.id,
          details: {
            name: workType.name,
            description: workType.description,
          },
          performed_by: user?.id,
        },
      ]);

      toast({
        title: "Sucesso",
        description: "Tipo de trabalho acadêmico adicionado com sucesso.",
      });
      setNewType({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["academicWorkTypes"] });
    } catch (error) {
      console.error("Error adding work type:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tipo de trabalho acadêmico.",
        variant: "destructive",
      });
    }
  };

  const toggleWorkTypeStatus = async (id: string, currentStatus: boolean) => {
    try {
      setUpdating(true);
      const { data: workType, error } = await supabase
        .from("academic_work_types")
        .update({ is_active: !currentStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Log the status change
      await supabase.from("system_logs").insert([
        {
          action: "UPDATE",
          entity_type: "academic_work_types",
          entity_id: workType.id,
          details: {
            field: "is_active",
            old_value: currentStatus,
            new_value: !currentStatus,
          },
          performed_by: user?.id,
        },
      ]);

      toast({
        title: "Sucesso",
        description: "Status do tipo de trabalho atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["academicWorkTypes"] });
    } catch (error) {
      console.error("Error updating work type status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do tipo de trabalho.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddWorkType} className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Nome do tipo de trabalho"
            value={newType.name}
            onChange={(e) => setNewType({ ...newType, name: e.target.value })}
          />
          <Textarea
            placeholder="Descrição (opcional)"
            value={newType.description}
            onChange={(e) =>
              setNewType({ ...newType, description: e.target.value })
            }
          />
        </div>
        <Button type="submit">Adicionar Tipo de Trabalho</Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workTypes?.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.name}</TableCell>
              <TableCell>{type.description}</TableCell>
              <TableCell>{type.is_active ? "Ativo" : "Inativo"}</TableCell>
              <TableCell>
                <Switch
                  checked={type.is_active}
                  onCheckedChange={() =>
                    toggleWorkTypeStatus(type.id, type.is_active || false)
                  }
                  disabled={updating}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AcademicWorkTypeManagement;