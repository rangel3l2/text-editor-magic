import { useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface WorkType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface WorkTypesTableProps {
  workTypes: WorkType[];
}

export const WorkTypesTable = ({ workTypes }: WorkTypesTableProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

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
      const { error: logError } = await supabase.from("system_logs").insert([
        {
          action: "UPDATE",
          entity_type: "academic_work_types",
          entity_id: id,
          details: {
            field: "is_active",
            old_value: currentStatus,
            new_value: !currentStatus,
          },
          performed_by: user?.id,
        },
      ]);

      if (logError) {
        console.error("Error creating log:", logError);
        throw logError;
      }

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

  return (
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
  );
};