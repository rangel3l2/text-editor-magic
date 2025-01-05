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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

const AcademicWorkTypeManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [updating, setUpdating] = useState(false);

  const { data: workTypes, refetch } = useQuery({
    queryKey: ["academicWorkTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_work_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching work types:", error);
        throw error;
      }

      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do tipo de trabalho é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("academic_work_types").insert({
        name: newType.name,
        description: newType.description,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de trabalho acadêmico adicionado com sucesso.",
      });
      setNewType({ name: "", description: "" });
      // Invalidate both queries to ensure all components update
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

  const handleToggleActive = async (typeId: string, currentValue: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("academic_work_types")
        .update({ is_active: !currentValue })
        .eq("id", typeId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status do tipo de trabalho atualizado com sucesso.",
      });
      // Invalidate both queries to ensure all components update
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

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit">Adicionar Tipo de Trabalho</Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ativo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workTypes?.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.name}</TableCell>
              <TableCell>{type.description}</TableCell>
              <TableCell>
                <Switch
                  checked={type.is_active}
                  disabled={updating}
                  onCheckedChange={() =>
                    handleToggleActive(type.id, type.is_active)
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

export default AcademicWorkTypeManagement;