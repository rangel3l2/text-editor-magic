import { BookText, FileText, GraduationCap } from "lucide-react";

const WhyChooseSection = () => {
  return (
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
  );
};

export default WhyChooseSection;