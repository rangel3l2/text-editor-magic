import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddWorkTypeForm } from "./work-types/AddWorkTypeForm";
import { WorkTypesTable } from "./work-types/WorkTypesTable";

const AcademicWorkTypeManagement = () => {
  const { data: workTypes, isLoading } = useQuery({
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

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <AddWorkTypeForm />
      <WorkTypesTable workTypes={workTypes || []} />
    </div>
  );
};

export default AcademicWorkTypeManagement;