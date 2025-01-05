import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const AddWorkTypeForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState({ name: "", description: "" });

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

  return (
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
  );
};