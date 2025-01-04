import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { BookText, GraduationCap, FileText } from "lucide-react";

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
    <div className="container mx-auto p-6">
      <div className="text-center mb-16">
        <img 
          src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png" 
          alt="AIcademic Logo" 
          className="mx-auto w-32 h-32 mb-4"
        />
        <h1 className="text-4xl font-bold mb-2">AIcademic</h1>
        <p className="text-lg text-muted-foreground">
          Escreva, aprenda, conclua – com AIcademic
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Meus Trabalhos</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookText className="h-5 w-5" />
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Nenhum trabalho em andamento</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Nenhum trabalho concluído</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Trabalhos Acadêmicos Disponíveis</h2>
        {workTypes && workTypes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workTypes.map((type) => (
              <Card key={type.id} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {type.name}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {type.name === "Banner Acadêmico" && (
                      <>
                        <p>• Formatação padronizada</p>
                        <p>• Seções estruturadas</p>
                        <p>• Exportação em alta qualidade</p>
                      </>
                    )}
                    {type.name === "Artigo Científico" && (
                      <>
                        <p>• Normas ABNT</p>
                        <p>• Citações automáticas</p>
                        <p>• Referências formatadas</p>
                      </>
                    )}
                    {type.name === "Tese/Dissertação" && (
                      <>
                        <p>• Estrutura completa</p>
                        <p>• Formatação acadêmica</p>
                        <p>• Sumário automático</p>
                      </>
                    )}
                  </div>
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
      </div>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-8">Por que escolher o AIcademic?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <BookText className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fácil de Usar</h3>
            <p className="text-muted-foreground">Interface intuitiva e amigável para todos os usuários</p>
          </div>
          <div>
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Formatação Automática</h3>
            <p className="text-muted-foreground">Seus trabalhos sempre seguirão as normas acadêmicas</p>
          </div>
          <div>
            <GraduationCap className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Exportação Flexível</h3>
            <p className="text-muted-foreground">Exporte seus trabalhos em diversos formatos</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;