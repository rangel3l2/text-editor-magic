import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWorkRealtime = (
  workId: string | undefined,
  userId: string | undefined,
  onContentUpdate: (content: any) => void
) => {
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!workId || !userId) return;

    // Canal de presença para usuários ativos
    const presenceChannel = supabase.channel(`work-presence-${workId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state);
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('Usuário entrou:', key);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('Usuário saiu:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Canal para mudanças no conteúdo
    const contentChannel = supabase
      .channel(`work-content-${workId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_in_progress',
          filter: `id=eq.${workId}`,
        },
        (payload) => {
          console.log('Conteúdo atualizado:', payload);
          if (payload.new && payload.new.content) {
            onContentUpdate(payload.new.content);
          }
        }
      )
      .subscribe();

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(contentChannel);
      setIsConnected(false);
    };
  }, [workId, userId, onContentUpdate]);

  return {
    activeUsers,
    isConnected,
  };
};