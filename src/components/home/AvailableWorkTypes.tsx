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
      
      // First, fetch all active work types
      const { data: typesData, error: typesError } = await supabase
        .from("academic_work_types")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (typesError) {
        console.error("Error fetching work types:", typesError);
        throw typesError;
      }

      console.log("Active work types fetched:", typesData);

      // If there are work types, fetch the admin status for their creators
      if (typesData && typesData.length > 0) {
        const creatorIds = typesData
          .map((type) => type.created_by)
          .filter(Boolean);

        if (creatorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, is_admin")
            .in("id", creatorIds);

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
          }

          console.log("Creator profiles fetched:", profilesData);

          // Create a map of user IDs to admin status
          const adminMap = new Map(
            profilesData?.map((profile) => [profile.id, profile.is_admin]) || []
          );

          // For non-authenticated users, show work types created by admins
          if (!user) {
            const adminWorkTypes = typesData.filter((type) => {
              const isAdminCreated = type.created_by && adminMap.get(type.created_by);
              console.log(`Work type ${type.name} created by admin: ${isAdminCreated}`);
              return isAdminCreated;
            });
            
            console.log("Work types for non-auth users:", adminWorkTypes);
            return adminWorkTypes;
          }
        }

        // For authenticated users or if no creator IDs found, return all active work types
        console.log("Returning all active work types:", typesData);
        return typesData;
      }

      console.log("No work types found");
      return [];
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