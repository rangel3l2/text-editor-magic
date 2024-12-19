import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, FileText, BriefcaseIcon } from "lucide-react";

export const MyWorksSection = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center mb-8">Meus Trabalhos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-6 w-6" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BriefcaseIcon className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum trabalho em andamento</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BriefcaseIcon className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhum trabalho concluído</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};