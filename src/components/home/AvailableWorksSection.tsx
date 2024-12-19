import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, FileText, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const AvailableWorksSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = (type: string) => {
    navigate(`/banner?type=${type}`);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">Trabalhos Acadêmicos Disponíveis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleCardClick('banner')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-6 w-6" />
              Banner Acadêmico
            </CardTitle>
            <CardDescription>
              Crie banners acadêmicos profissionais para apresentações e eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-gray-600">
              <li>Formatação padronizada</li>
              <li>Seções estruturadas</li>
              <li>Exportação em alta qualidade</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleCardClick('article')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Artigo Científico
            </CardTitle>
            <CardDescription>
              Desenvolva artigos científicos seguindo normas acadêmicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-gray-600">
              <li>Normas ABNT</li>
              <li>Citações automáticas</li>
              <li>Referências formatadas</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleCardClick('thesis')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Tese/Dissertação
            </CardTitle>
            <CardDescription>
              Estruture sua tese ou dissertação de forma profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-gray-600">
              <li>Estrutura completa</li>
              <li>Formatação acadêmica</li>
              <li>Sumário automático</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};