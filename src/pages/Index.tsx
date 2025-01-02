import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const { data: workTypes } = useQuery({
    queryKey: ["academicWorkTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_work_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
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
      default:
        return "/";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workTypes?.map((type) => (
          <Card key={type.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{type.name}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => navigate(getRouteForWorkType(type.name))}
              >
                Começar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;