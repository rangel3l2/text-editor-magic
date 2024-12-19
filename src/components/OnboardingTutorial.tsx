import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, BookOpen, Robot, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    title: "Bem-vindo ao AIcademic!",
    description: "Seu orientador virtual para trabalhos acadêmicos.",
    icon: <Robot className="w-12 h-12 text-primary mb-4" />,
    content: "O AIcademic é uma plataforma inovadora que combina edição de texto e orientação por inteligência artificial para ajudar você a criar trabalhos acadêmicos de qualidade.",
  },
  {
    title: "Editor Integrado",
    description: "Escreva seus trabalhos diretamente na plataforma.",
    icon: <Pencil className="w-12 h-12 text-primary mb-4" />,
    content: "Nosso editor integrado elimina a necessidade de softwares externos. Você pode escrever, formatar e organizar seu trabalho em um só lugar.",
  },
  {
    title: "Orientação Inteligente",
    description: "Receba feedback em tempo real.",
    icon: <Robot className="w-12 h-12 text-primary mb-4" />,
    content: "Enquanto você escreve, nossa IA fornece sugestões, correções e orientações para melhorar seu trabalho acadêmico.",
  },
  {
    title: "Formatação Automática",
    description: "Seu trabalho sempre nas normas.",
    icon: <FileText className="w-12 h-12 text-primary mb-4" />,
    content: "Esqueça as preocupações com formatação. O AIcademic cuida automaticamente das normas acadêmicas enquanto você foca no conteúdo.",
  },
];

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_preferences')
          .select('has_seen_tutorial')
          .eq('user_id', user.id)
          .single();

        if (!data) {
          // Se não existir registro, criar um novo
          await supabase
            .from('user_preferences')
            .insert([
              { user_id: user.id, has_seen_tutorial: false }
            ]);
          setHasSeenTutorial(false);
          setOpen(true);
        } else {
          setHasSeenTutorial(data.has_seen_tutorial);
          if (!data.has_seen_tutorial) {
            setOpen(true);
          }
        }
      }
    };

    checkTutorialStatus();
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_preferences')
        .update({ has_seen_tutorial: true })
        .eq('user_id', user.id);
    }
    setOpen(false);
  };

  if (hasSeenTutorial) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            {steps[currentStep].icon}
            <DialogTitle>{steps[currentStep].title}</DialogTitle>
            <DialogDescription className="mt-2">
              {steps[currentStep].description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="py-4 text-center">
          {steps[currentStep].content}
        </div>
        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {currentStep < steps.length - 1 ? "Próximo" : "Começar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}