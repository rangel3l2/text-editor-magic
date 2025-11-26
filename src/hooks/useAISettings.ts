import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISettings {
  enabled: boolean;
}

export const useAISettings = () => {
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAISettings = async () => {
      console.log('🔄 Fetching AI settings...');
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'ai_validation_enabled')
          .single();

        if (error) {
          console.error('❌ Error fetching AI settings:', error);
          return;
        }

        if (data) {
          const settings = data.setting_value as unknown as AISettings;
          console.log('✅ AI settings loaded:', settings);
          setAiEnabled(settings.enabled);
        }
      } catch (error) {
        console.error('❌ Error in fetchAISettings:', error);
      } finally {
        console.log('✅ AI settings loading complete');
        setIsLoading(false);
      }
    };

    fetchAISettings();

    // Subscribe to changes
    const channel = supabase
      .channel('ai-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'setting_key=eq.ai_validation_enabled'
        },
        (payload) => {
          const settings = payload.new.setting_value as unknown as AISettings;
          setAiEnabled(settings.enabled);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { aiEnabled, isLoading };
};
