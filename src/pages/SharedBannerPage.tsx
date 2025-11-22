import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const SharedBannerPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSharedTemplate = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      try {
        // Buscar trabalho pelo token
        const { data: work, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('share_token', token)
          .maybeSingle();

        if (error) throw error;

        if (!work) {
          toast({
            title: 'Trabalho não encontrado',
            description: 'O link pode estar incorreto ou o trabalho foi removido',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        // Verificar se usuário está autenticado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast({
            title: 'Faça login para continuar',
            description: 'Você precisa estar logado para visualizar este trabalho',
          });
          navigate('/', { 
            state: { 
              returnTo: `/banner/shared/${token}` 
            } 
          });
          return;
        }

        toast({
          title: 'Trabalho carregado',
          description: 'Redirecionando para o editor...',
        });

        // Redirecionar para o editor com o trabalho
        navigate(`/?workId=${work.id}`);
      } catch (error) {
        console.error('Erro ao carregar trabalho compartilhado:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o trabalho',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadSharedTemplate();
  }, [token, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando template...</p>
        </div>
      </div>
    );
  }

  return null;
};
