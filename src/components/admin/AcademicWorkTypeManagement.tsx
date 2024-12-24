import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

interface WorkType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

const AcademicWorkTypeManagement = () => {
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workTypes, isLoading } = useQuery({
    queryKey: ["workTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_work_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching work types:", error);
        throw error;
      }

      return data as WorkType[];
    },
  });

  const addWorkTypeMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { error } = await supabase
        .from("academic_work_types")
        .insert([{ name, description }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workTypes"] });
      toast({
        title: "Sucesso",
        description: "Tipo de trabalho acadêmico adicionado com sucesso",
      });
      setNewTypeName("");
      setNewTypeDescription("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar tipo de trabalho acadêmico",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("academic_work_types")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workTypes"] });
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTypeName) {
      addWorkTypeMutation.mutate({
        name: newTypeName,
        description: newTypeDescription,
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="name">Nome do Tipo de Trabalho</label>
            <Input
              id="name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Ex: TCC, Artigo Científico"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description">Descrição</label>
            <Textarea
              id="description"
              value={newTypeDescription}
              onChange={(e) => setNewTypeDescription(e.target.value)}
              placeholder="Descreva o tipo de trabalho acadêmico"
            />
          </div>
        </div>
        <Button type="submit" disabled={addWorkTypeMutation.isPending}>
          Adicionar Tipo
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
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
                  onCheckedChange={(checked) =>
                    toggleActiveMutation.mutate({ id: type.id, is_active: checked })
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