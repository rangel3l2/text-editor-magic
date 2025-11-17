import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AISettingsManagement = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_validation_enabled')
        .single();

      if (error) throw error;

      if (data) {
        const settings = data.setting_value as unknown as { enabled: boolean };
        setAiEnabled(settings.enabled);
      }
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: 'Não foi possível carregar as configurações de IA',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: { enabled },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'ai_validation_enabled');

      if (error) throw error;

      setAiEnabled(enabled);
      
      toast({
        title: enabled ? 'IA Ativada' : 'IA Desativada',
        description: enabled 
          ? 'Validação com IA e orientador virtual foram ativados'
          : 'Sistema agora funciona apenas como editor de texto',
        duration: 5000
      });
    } catch (error) {
      console.error('Error updating AI settings:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar as configurações de IA',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Configurações de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Configurações de Inteligência Artificial
        </CardTitle>
        <CardDescription>
          Controle as funcionalidades de IA do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Esta configuração afeta todos os usuários do sistema.
            {aiEnabled 
              ? ' Desativar a IA removerá as funcionalidades de validação e orientador virtual.'
              : ' Ativar a IA habilitará validação inteligente e orientador virtual para todos os usuários.'}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="ai-toggle" className="text-base font-semibold">
              Validação com IA e Orientador Virtual
            </Label>
            <p className="text-sm text-muted-foreground">
              {aiEnabled 
                ? 'O sistema está com todas as funcionalidades de IA ativas, incluindo validação de conteúdo e orientador virtual.'
                : 'O sistema está funcionando apenas como editor de texto, sem validação de IA ou orientador virtual.'}
            </p>
          </div>
          <Switch
            id="ai-toggle"
            checked={aiEnabled}
            onCheckedChange={handleToggle}
            disabled={isSaving}
            className="data-[state=checked]:bg-green-600"
          />
        </div>

        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h4 className="font-medium text-sm">Recursos afetados:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Validação automática de títulos e conteúdo</li>
            <li>Orientador virtual com sugestões contextuais</li>
            <li>Feedback inteligente durante a escrita</li>
            <li>Verificação ortográfica e gramatical avançada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettingsManagement;
