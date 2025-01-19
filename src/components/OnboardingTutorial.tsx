import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, BookOpen, Bot, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const steps = [
  {
    title: "Bem-vindo ao AIcademic!",
    description: "Seu orientador virtual para trabalhos acadêmicos.",
    icon: <Bot className="w-12 h-12 text-primary mb-4" />,
    content: "O AIcademic é uma plataforma inovadora que combina edição de texto e orientação por inteligência artificial para ajudar você a criar trabalhos acadêmicos de qualidade.",
  },
  {
    title: "Editor Integrado",
    description: "Tudo que você precisa em um só lugar.",
    icon: <Pencil className="w-12 h-12 text-primary mb-4" />,
    content: "Nosso editor integrado permite que você crie seu trabalho acadêmico sem precisar alternar entre diferentes programas.",
  },
  {
    title: "Orientação Inteligente",
    description: "Receba feedback em tempo real.",
    icon: <Bot className="w-12 h-12 text-primary mb-4" />,
    content: "Enquanto você escreve, nossa IA fornece sugestões, correções e orientações para melhorar seu trabalho acadêmico.",
  },
  {
    title: "Formatação Automática",
    description: "Seu trabalho sempre nas normas.",
    icon: <FileText className="w-12 h-12 text-primary mb-4" />,
    content: "Não se preocupe com formatação! O AIcademic cuida disso para você, seguindo todas as normas acadêmicas necessárias.",
  },
];

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const location = useLocation();

  // Check if we're on an existing work page (has an ID in the URL)
  const isExistingWork = location.pathname.split('/').length > 2;

  useEffect(() => {
    // Don't show tutorial on existing work pages
    if (isExistingWork) {
      return;
    }

    const checkTutorialStatus = async () => {
      // First check localStorage for all users
      const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
      if (hasSeenTutorial === "true") {
        setOpen(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For anonymous users, we already checked localStorage
        setOpen(true);
        return;
      }

      // For logged in users, check database
      const { data, error } = await supabase
        .from('user_preferences')
        .select('has_seen_tutorial')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking tutorial status:", error);
        return;
      }

      // If user has seen tutorial in database, save to localStorage too
      if (data?.has_seen_tutorial) {
        localStorage.setItem("hasSeenTutorial", "true");
        setOpen(false);
        return;
      }

      // Show tutorial if user hasn't seen it
      setOpen(true);
    };

    checkTutorialStatus();
  }, [isExistingWork]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    // Save in localStorage for all users
    localStorage.setItem("hasSeenTutorial", "true");
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Save preference in database for logged in users
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            has_seen_tutorial: true
          } satisfies Database['public']['Tables']['user_preferences']['Update'])
          .eq('user_id', user.id);
      } catch (error) {
        console.error("Error saving tutorial preference:", error);
      }
    }
    
    setOpen(false);
  };

  // Don't render anything if we're on an existing work page
  if (isExistingWork) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            {steps[currentStep].icon}
            <DialogTitle>{steps[currentStep].title}</DialogTitle>
            <DialogDescription>
              {steps[currentStep].description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-muted-foreground">
            {steps[currentStep].content}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleNext} className="w-full">
            {currentStep < steps.length - 1 ? "Próximo" : "Começar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}