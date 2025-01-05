import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import WorkTypeCard from "./WorkTypeCard";
import { useAuth } from "@/contexts/AuthContext";

interface AvailableWorkTypesProps {
  onStart: (route: string) => void;
}

const AvailableWorkTypes = ({ onStart }: AvailableWorkTypesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: workTypes, error } = useQuery({
    queryKey: ["academicWorkTypes"],
    queryFn: async () => {
      console.log("Fetching work types...");
      
      // Fetch only active work types
      const { data: typesData, error: typesError } = await supabase
        .from("academic_work_types")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (typesError) {
        console.error("Error fetching work types:", typesError);
        throw typesError;
      }

      if (!typesData || typesData.length === 0) {
        console.log("No work types found");
        return [];
      }

      console.log("Active work types found:", typesData);
      return typesData;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <h2 className="text-2xl font-bold text-center mb-8 text-purple-800">
        Trabalhos Acadêmicos Disponíveis
      </h2>
      {workTypes && workTypes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
        <div className="text-center p-8 bg-muted rounded-lg max-w-2xl mx-auto">
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