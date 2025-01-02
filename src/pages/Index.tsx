import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
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

  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Welcome Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao AIcademic</h1>
        <p className="text-xl text-muted-foreground">
          Seu assistente inteligente para trabalhos acadêmicos
        </p>
      </section>

      {/* Academic Work Types Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Tipos de Trabalhos Acadêmicos</h2>
        {error ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-red-600">
              Erro ao carregar tipos de trabalho
            </h3>
            <p className="mt-2 text-gray-600">
              Por favor, tente novamente mais tarde.
            </p>
          </div>
        ) : workTypes && workTypes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workTypes.map((type) => (
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
      </section>

      {/* Features Section */}
      <section className="bg-muted p-8 rounded-lg">
        <h2 className="text-2xl font-semibold mb-6">Recursos</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Formatação Automática</CardTitle>
              <CardDescription>
                Seus trabalhos sempre seguirão as normas ABNT
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revisão Inteligente</CardTitle>
              <CardDescription>
                Sugestões de melhorias em tempo real
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Exportação Flexível</CardTitle>
              <CardDescription>
                Exporte seus trabalhos em diversos formatos
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;