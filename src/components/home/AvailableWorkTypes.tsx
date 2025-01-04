import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import WorkTypeCard from "./WorkTypeCard";

interface AvailableWorkTypesProps {
  onStart: (route: string) => void;
}

const AvailableWorkTypes = ({ onStart }: AvailableWorkTypesProps) => {
  const { toast } = useToast();

  const { data: workTypes, error } = useQuery({
    queryKey: ["academicWorkTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_work_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching work types:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tipos de trabalho acadêmico.",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  const getRouteForWorkType = (name: string) => {
    switch (name) {
      case "Banner Acadêmico":
        return "/banner";
      case "Artigo Científico":
        return "/article";
      case "Tese/Dissertação":
        return "/thesis";
      case "Monografia":
        return "/monography";
      case "Projeto de Intervenção":
        return "/intervention";
      default:
        return "/";
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          Erro ao carregar tipos de trabalho
        </h2>
        <p className="mt-2 text-gray-600">
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-center mb-8">Trabalhos Acadêmicos Disponíveis</h2>
      {workTypes && workTypes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workTypes.map((type) => (
            <WorkTypeCard
              key={type.id}
              type={type}
              onStart={onStart}
              getRouteForWorkType={getRouteForWorkType}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-muted rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">
            Nenhum tipo de trabalho acadêmico disponível no momento
          </h3>
          <p className="mt-2 text-muted-foreground">
            Por favor, volte mais tarde.
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailableWorkTypes;