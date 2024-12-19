import { BookOpen, PenTool, FileText } from "lucide-react";

export const FeaturesSection = () => {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o AIcademic?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Fácil de Usar</h3>
            <p className="text-gray-600">Interface intuitiva e amigável para todos os usuários</p>
          </div>
          <div className="text-center">
            <PenTool className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Formatação Automática</h3>
            <p className="text-gray-600">Seus trabalhos sempre seguirão as normas acadêmicas</p>
          </div>
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Exportação Flexível</h3>
            <p className="text-gray-600">Exporte seus trabalhos em diversos formatos</p>
          </div>
        </div>
      </div>
    </div>
  );
};