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
    <Card className="shadow-lg">
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
          onClick={() => onStart(getRouteForWorkType(type.name))}
        >
          Começar
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkTypeCard;