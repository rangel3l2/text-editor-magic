import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { List, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ArticleSummaryProps {
  theoreticalTopicsCount: number;
  onNavigate: (sectionId: string) => void;
}

const ArticleSummary = ({ theoreticalTopicsCount, onNavigate }: ArticleSummaryProps) => {
  const [open, setOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    console.log('🔍 Procurando seção:', sectionId);
    const element = document.getElementById(sectionId);
    console.log('📍 Elemento encontrado:', element);
    
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setOpen(false);
    } else {
      console.error('❌ Elemento não encontrado no DOM:', sectionId);
      // Tentar encontrar todos os elementos com ID no DOM
      const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
      console.log('📋 Todos os IDs disponíveis:', allIds);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 fixed left-4 top-32 z-30 shadow-lg"
        >
          <List className="h-4 w-4" />
          Sumário
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Sumário do Artigo
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full mt-6 pb-20">
          <div className="space-y-1">
            {/* Elementos Pré-textuais */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Pré-textuais
              </p>
              <button
                onClick={() => onNavigate('article-title')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>Título</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => onNavigate('article-authors')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>Autores</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => onNavigate('article-abstract')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>Resumo</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Elementos Textuais */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Elementos Textuais
              </p>
              <button
                onClick={() => onNavigate('article-introduction')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>1. Introdução</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Referencial Teórico */}
              {Array.from({ length: theoreticalTopicsCount }).map((_, index) => (
                <button
                  key={`theoretical-${index}`}
                  onClick={() => onNavigate(`article-theoretical-${index}`)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group pl-6"
                >
                  <span>2.{index + 1} Tópico teórico {index + 1}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}

              <button
                onClick={() => onNavigate('article-methodology')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>{2 + theoreticalTopicsCount}. Metodologia</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => onNavigate('article-results')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>{2 + theoreticalTopicsCount + 1}. Resultados e Discussão</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => onNavigate('article-conclusion')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>3. Conclusão</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Elementos Pós-textuais */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Pós-textuais
              </p>
              <button
                onClick={() => onNavigate('article-references')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>Referências</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => onNavigate('article-appendices')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>Apêndices</span>
                <Badge variant="outline" className="ml-2 text-xs">Opcional</Badge>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => onNavigate('article-attachments')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
              >
                <span>Anexos</span>
                <Badge variant="outline" className="ml-2 text-xs">Opcional</Badge>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ArticleSummary;
