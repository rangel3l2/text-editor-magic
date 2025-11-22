import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type SharePermission = 'viewer' | 'editor' | 'commenter';

export interface WorkShare {
  id: string;
  work_id: string;
  shared_by: string;
  shared_with_email: string;
  permission: SharePermission;
  created_at: string;
  updated_at: string;
}

export interface WorkComment {
  id: string;
  work_id: string;
  section_name: string;
  user_id: string;
  user_email: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

export const useWorkSharing = (workId: string | undefined, userId: string | undefined) => {
  const { toast } = useToast();
  const [shares, setShares] = useState<WorkShare[]>([]);
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [userPermission, setUserPermission] = useState<SharePermission | 'owner' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar shares e permissões
  useEffect(() => {
    if (!workId || !userId) {
      setIsLoading(false);
      return;
    }

    const loadSharingData = async () => {
      try {
        // Verificar se é o dono
        const { data: work } = await supabase
          .from('work_in_progress')
          .select('user_id, share_token')
          .eq('id', workId)
          .single();

        if (work?.user_id === userId) {
          setUserPermission('owner');
          setShareToken(work.share_token);
        } else {
          // Verificar permissão do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

          if (profile) {
            const { data: share } = await supabase
              .from('work_shares')
              .select('permission')
              .eq('work_id', workId)
              .eq('shared_with_email', profile.email)
              .single();

            setUserPermission(share?.permission || null);
          }
        }

        // Carregar lista de compartilhamentos (apenas para donos)
        if (work?.user_id === userId) {
          const { data: sharesData } = await supabase
            .from('work_shares')
            .select('*')
            .eq('work_id', workId)
            .order('created_at', { ascending: false });

          if (sharesData) {
            setShares(sharesData);
          }
        }

        // Carregar comentários
        const { data: commentsData } = await supabase
          .from('work_comments')
          .select('*')
          .eq('work_id', workId)
          .order('created_at', { ascending: true });

        if (commentsData) {
          setComments(commentsData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de compartilhamento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSharingData();

    // Configurar realtime para comentários
    const commentsChannel = supabase
      .channel(`work-comments-${workId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_comments',
          filter: `work_id=eq.${workId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments((prev) => [...prev, payload.new as WorkComment]);
          } else if (payload.eventType === 'UPDATE') {
            setComments((prev) =>
              prev.map((comment) =>
                comment.id === payload.new.id ? (payload.new as WorkComment) : comment
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((comment) => comment.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Configurar realtime para shares
    const sharesChannel = supabase
      .channel(`work-shares-${workId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_shares',
          filter: `work_id=eq.${workId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setShares((prev) => [...prev, payload.new as WorkShare]);
          } else if (payload.eventType === 'UPDATE') {
            setShares((prev) =>
              prev.map((share) =>
                share.id === payload.new.id ? (payload.new as WorkShare) : share
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setShares((prev) => prev.filter((share) => share.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(sharesChannel);
    };
  }, [workId, userId]);

  const generateShareLink = async () => {
    if (!workId || !userId) return null;

    try {
      // Gerar token se não existir
      if (!shareToken) {
        const { data: tokenData } = await supabase.rpc('generate_work_share_token');
        
        const { error: updateError } = await supabase
          .from('work_in_progress')
          .update({ share_token: tokenData })
          .eq('id', workId);

        if (updateError) throw updateError;

        setShareToken(tokenData);
        return tokenData;
      }

      return shareToken;
    } catch (error) {
      console.error('Erro ao gerar link de compartilhamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o link de compartilhamento',
        variant: 'destructive',
      });
      return null;
    }
  };

  const shareWork = async (email: string, permission: SharePermission) => {
    if (!workId || !userId) return;

    try {
      const { error } = await supabase.from('work_shares').insert({
        work_id: workId,
        shared_by: userId,
        shared_with_email: email,
        permission,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Trabalho compartilhado com ${email} como ${permission}`,
      });
    } catch (error: any) {
      console.error('Erro ao compartilhar trabalho:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível compartilhar o trabalho',
        variant: 'destructive',
      });
    }
  };

  const updateShare = async (shareId: string, permission: SharePermission) => {
    try {
      const { error } = await supabase
        .from('work_shares')
        .update({ permission })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Permissão atualizada',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a permissão',
        variant: 'destructive',
      });
    }
  };

  const removeShare = async (shareId: string) => {
    try {
      const { error } = await supabase.from('work_shares').delete().eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Compartilhamento removido',
      });
    } catch (error: any) {
      console.error('Erro ao remover compartilhamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o compartilhamento',
        variant: 'destructive',
      });
    }
  };

  const addComment = async (sectionName: string, commentText: string) => {
    if (!workId || !userId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) throw new Error('Email do usuário não encontrado');

      const { error } = await supabase.from('work_comments').insert({
        work_id: workId,
        section_name: sectionName,
        user_id: userId,
        user_email: profile.email,
        comment_text: commentText,
      });

      if (error) throw error;

      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi adicionado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o comentário',
        variant: 'destructive',
      });
    }
  };

  const updateComment = async (commentId: string, commentText: string) => {
    try {
      const { error } = await supabase
        .from('work_comments')
        .update({ comment_text: commentText })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Comentário atualizado',
        description: 'Seu comentário foi atualizado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o comentário',
        variant: 'destructive',
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('work_comments').delete().eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Comentário removido',
        description: 'Seu comentário foi removido com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao remover comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o comentário',
        variant: 'destructive',
      });
    }
  };

  return {
    shares,
    comments,
    shareToken,
    userPermission,
    isLoading,
    generateShareLink,
    shareWork,
    updateShare,
    removeShare,
    addComment,
    updateComment,
    deleteComment,
  };
};