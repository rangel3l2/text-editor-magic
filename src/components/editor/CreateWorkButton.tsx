import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateWorkButtonProps {
  user: User | null;
  workType: 'banner' | 'article' | 'monography' | 'thesis' | 'intervention_project';
  content: any;
  currentWorkId: string | null;
  onLoginRequired?: () => void;
  className?: string;
}

const workTypeRoutes: Record<string, string> = {
  banner: '/banner',
  article: '/article',
  monography: '/monography',
  thesis: '/thesis',
  intervention_project: '/intervention-project',
};

const workTypeNames: Record<string, string> = {
  banner: 'Banner',
  article: 'Artigo Científico',
  monography: 'Monografia',
  thesis: 'Tese',
  intervention_project: 'Projeto de Intervenção',
};

export const CreateWorkButton = ({
  user,
  workType,
  content,
  currentWorkId,
  onLoginRequired,
  className,
}: CreateWorkButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Não mostrar se já existe um trabalho
  if (currentWorkId) {
    return null;
  }

  const generateTitle = () => {
    // Tentar extrair título do conteúdo
    const contentTitle = content?.title?.replace(/<[^>]*>/g, '').trim();
    if (contentTitle && contentTitle.length > 0) {
      return contentTitle;
    }
    
    // Título padrão com timestamp
    const timestamp = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${workTypeNames[workType]} - ${timestamp}`;
  };

  const handleCreateWork = async () => {
    if (!user) {
      onLoginRequired?.();
      toast({
        title: "Login necessário",
        description: "Faça login para salvar seu trabalho.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const workTitle = generateTitle();
      
      const { data, error } = await supabase
        .from('work_in_progress')
        .insert([
          {
            user_id: user.id,
            title: workTitle,
            work_type: workType,
            content: content,
          }
        ])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating work:', error);
        throw error;
      }
      
      if (data) {
        // Limpar draft do localStorage se existir
        localStorage.removeItem(`${workType}_work_${user.id}_draft`);
        
        toast({
          title: "✨ Trabalho criado!",
          description: `Seu ${workTypeNames[workType].toLowerCase()} foi salvo com sucesso.`,
        });
        
        // Navegar para a rota com o ID
        navigate(`${workTypeRoutes[workType]}/${data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating work:', error);
      toast({
        title: "Erro ao criar trabalho",
        description: "Não foi possível salvar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreateWork}
      disabled={isCreating}
      className={cn(
        "group relative overflow-hidden",
        "bg-gradient-to-r from-primary via-primary/90 to-primary",
        "hover:from-primary/90 hover:via-primary hover:to-primary/90",
        "text-primary-foreground font-semibold",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-out",
        "border-0",
        "px-6 py-3 h-auto",
        className
      )}
      size="lg"
    >
      {/* Efeito de brilho animado */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      <span className="relative flex items-center gap-2">
        {isCreating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Criando...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
            <FileText className="h-4 w-4" />
            <span>Criar Trabalho</span>
          </>
        )}
      </span>
    </Button>
  );
};

export default CreateWorkButton;
