import { BookText, FileText, GraduationCap } from "lucide-react";

const WhyChooseSection = () => {
  return (
    <section className="text-center px-3 sm:px-4 py-8 sm:py-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 animate-fade-in">Por que escolher o AIcademic?</h2>
      <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        <div className="p-4 sm:p-6 rounded-lg hover:bg-accent/50 transition-colors animate-slide-up">
          <BookText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-purple-600" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Fácil de Usar</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Interface intuitiva e amigável para todos os usuários</p>
        </div>
        <div className="p-4 sm:p-6 rounded-lg hover:bg-accent/50 transition-colors animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-purple-600" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Formatação Automática</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Seus trabalhos sempre seguirão as normas acadêmicas</p>
        </div>
        <div className="p-4 sm:p-6 rounded-lg hover:bg-accent/50 transition-colors animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-purple-600" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Exportação Flexível</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Exporte seus trabalhos em diversos formatos</p>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;