import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { updateWorkTypeStatus } from "./services/workTypeService";
import { logWorkTypeUpdate } from "./services/systemLogService";

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
      console.log("Toggling work type status...", {
        workTypeId: id,
        currentStatus,
        userId: user.id,
      });

      await updateWorkTypeStatus(id, currentStatus);
      
      const workTypeName = workTypes.find((wt) => wt.id === id)?.name;
      
      await logWorkTypeUpdate({
        workTypeId: id,
        workTypeName,
        oldValue: currentStatus,
        newValue: !currentStatus,
        userId: user.id,
        userEmail: user.email || "",
      });

      // Invalidate both queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["academicWorkTypes"] });
      queryClient.invalidateQueries({ queryKey: ["systemLogs"] });

      toast({
        title: "Sucesso",
        description: `Status do tipo de trabalho "${workTypeName}" atualizado com sucesso.`,
      });
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