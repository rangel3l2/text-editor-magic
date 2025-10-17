import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

interface WorkTypeCardProps {
  type: {
    id: string;
    name: string;
    description: string;
  };
  onStart: (route: string) => void;
  getRouteForWorkType: (name: string) => string;
}

const WorkTypeCard = ({ type, onStart, getRouteForWorkType }: WorkTypeCardProps) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-700 text-lg sm:text-xl">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span className="line-clamp-2">{type.name}</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base line-clamp-3">{type.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-2">
        <div className="space-y-2 mb-4 text-xs sm:text-sm text-muted-foreground">
          {type.name === "Banner Acadêmico" && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Formatação padronizada</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Seções estruturadas</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Exportação em alta qualidade</span>
              </p>
            </>
          )}
          {type.name === "Artigo Científico" && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Normas ABNT</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Citações automáticas</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Referências formatadas</span>
              </p>
            </>
          )}
          {type.name === "Tese/Dissertação" && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Estrutura completa</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Formatação acadêmica</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span>Sumário automático</span>
              </p>
            </>
          )}
        </div>
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-auto h-10 sm:h-11 text-sm sm:text-base font-medium transition-colors"
          onClick={() => onStart(getRouteForWorkType(type.name))}
        >
          Começar
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkTypeCard;