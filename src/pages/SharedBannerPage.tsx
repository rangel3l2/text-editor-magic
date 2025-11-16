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
        // Buscar template pelo token
        const { data: template, error } = await supabase
          .from('banner_templates')
          .select('*')
          .eq('share_token', token)
          .eq('is_public', true)
          .single();

        if (error) throw error;

        if (!template) {
          toast({
            title: 'Template não encontrado',
            description: 'O link pode estar incorreto ou o template foi removido',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        // Incrementar contador de visualizações
        await supabase
          .from('banner_templates')
          .update({ views_count: (template.views_count || 0) + 1 })
          .eq('id', template.id);

        // Verificar se usuário está autenticado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Redirecionar para login com retorno para criar banner com template
          toast({
            title: 'Faça login para continuar',
            description: 'Você precisa estar logado para criar um banner',
          });
          navigate('/', { 
            state: { 
              templateToken: token,
              returnTo: `/banner/shared/${token}` 
            } 
          });
          return;
        }

        // Criar novo trabalho com o template
        const baseContent = (template.content as Record<string, any>) || {};
        const { data: newWork, error: workError } = await supabase
          .from('work_in_progress')
          .insert({
            user_id: user.id,
            work_type: 'banner',
            title: `Banner - ${template.title}`,
            content: {
              ...baseContent,
              institution: template.default_institution_name || '',
              institutionLogo: template.default_logo_url || '',
              templateId: template.id,
            },
          })
          .select()
          .single();

        if (workError) throw workError;

        toast({
          title: 'Template carregado',
          description: 'O banner foi criado com o template selecionado',
        });

        // Redirecionar para o editor de banner
        navigate(`/?workId=${newWork.id}`);
      } catch (error) {
        console.error('Erro ao carregar template compartilhado:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o template',
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
