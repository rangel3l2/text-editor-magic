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
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <GraduationCap className="h-5 w-5" />
          {type.name}
        </CardTitle>
        <CardDescription>{type.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          {type.name === "Banner Acadêmico" && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Formatação padronizada
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Seções estruturadas
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Exportação em alta qualidade
              </p>
            </>
          )}
          {type.name === "Artigo Científico" && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Normas ABNT
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Citações automáticas
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Referências formatadas
              </p>
            </>
          )}
          {type.name === "Tese/Dissertação" && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Estrutura completa
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Formatação acadêmica
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Sumário automático
              </p>
            </>
          )}
        </div>
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => onStart(getRouteForWorkType(type.name))}
        >
          Começar
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkTypeCard;