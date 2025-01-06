import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface WorkType {
  id: string;
  name: string;
}

export const useWorkTypeStatus = (workTypes: WorkType[]) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const toggleWorkTypeStatus = async (id: string, currentStatus: boolean) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      console.log("Toggling work type status...");

      const { data: workType, error: updateError } = await supabase
        .from("academic_work_types")
        .update({ is_active: !currentStatus })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating work type:", updateError);
        throw updateError;
      }

      console.log("Work type updated:", workType);

      const { error: logError } = await supabase.from("system_logs").insert([
        {
          action: "UPDATE",
          entity_type: "academic_work_types",
          entity_id: id,
          details: {
            field: "is_active",
            old_value: currentStatus,
            new_value: !currentStatus,
            work_type_name: workTypes.find(wt => wt.id === id)?.name
          },
          performed_by: user.id,
        },
      ]);

      if (logError) {
        console.error("Error creating system log:", logError);
        throw logError;
      }

      console.log("System log created successfully");

      toast({
        title: "Sucesso",
        description: "Status do tipo de trabalho atualizado com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["academicWorkTypes"] });
      queryClient.invalidateQueries({ queryKey: ["systemLogs"] });
    } catch (error) {
      console.error("Error in toggleWorkTypeStatus:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do tipo de trabalho.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    updating,
    toggleWorkTypeStatus,
  };
};