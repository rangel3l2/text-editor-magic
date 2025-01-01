import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, PenTool, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { LoginButton } from "@/components/LoginButton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const { data: workTypes, isLoading: isLoadingWorkTypes } = useQuery({
    queryKey: ["academicWorkTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_work_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching work types:", error);
        throw error;
      }

      return data;
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = (type: string) => {
    navigate(`/banner?type=${type}`);
  };

  if (isLoading || isLoadingWorkTypes) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-16">
            <img 
              src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png" 
              alt="AIcademic Logo" 
              className="w-64 h-auto mb-8"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              AIcademic
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
              Escreva, aprenda, conclua – com AIcademic
            </p>
            <LoginButton />
          </div>
        </div>
      </div>

      {/* My Works Section - Only visible for logged in users */}
      {user && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Meus Trabalhos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* In Progress Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-6 w-6" />
                  Em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum trabalho em andamento</p>
                </div>
              </CardContent>
            </Card>

            {/* Completed Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Concluídos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum trabalho concluído</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Academic Works Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Trabalhos Acadêmicos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workTypes?.map((type) => (
            <Card 
              key={type.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCardClick(type.name.toLowerCase())}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {type.name === "Banner Acadêmico" ? (
                    <PenTool className="h-6 w-6" />
                  ) : type.name === "Artigo Científico" ? (
                    <FileText className="h-6 w-6" />
                  ) : (
                    <GraduationCap className="h-6 w-6" />
                  )}
                  {type.name}
                </CardTitle>
                <CardDescription>
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                  {type.name === "Banner Acadêmico" && (
                    <>
                      <li>Formatação padronizada</li>
                      <li>Seções estruturadas</li>
                      <li>Exportação em alta qualidade</li>
                    </>
                  )}
                  {type.name === "Artigo Científico" && (
                    <>
                      <li>Normas ABNT</li>
                      <li>Citações automáticas</li>
                      <li>Referências formatadas</li>
                    </>
                  )}
                  {type.name === "Tese/Dissertação" && (
                    <>
                      <li>Estrutura completa</li>
                      <li>Formatação acadêmica</li>
                      <li>Sumário automático</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Por que escolher o AIcademic?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Fácil de Usar</h3>
              <p className="text-gray-600 dark:text-gray-300">Interface intuitiva e amigável para todos os usuários</p>
            </div>
            <div className="text-center">
              <PenTool className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Formatação Automática</h3>
              <p className="text-gray-600 dark:text-gray-300">Seus trabalhos sempre seguirão as normas acadêmicas</p>
            </div>
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Exportação Flexível</h3>
              <p className="text-gray-600 dark:text-gray-300">Exporte seus trabalhos em diversos formatos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;