import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Eye, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';

// Validation schema for banner template
const templateSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório').max(200, 'O título deve ter no máximo 200 caracteres'),
  institutionName: z.string().max(500, 'O nome da instituição deve ter no máximo 500 caracteres').optional().or(z.literal('')),
  logoUrl: z.string().url('URL do logo inválida').optional().or(z.literal('')),
  layoutConfig: z.object({
    columnLayout: z.string(),
    themeColor: z.string(),
  }),
});
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SharedTemplate {
  id: string;
  title: string;
  share_token: string;
  is_public: boolean;
  default_logo_url: string | null;
  default_institution_name: string | null;
  views_count: number;
  created_at: string;
}

export const SharedBannerTemplates = () => {
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState({
    title: '',
    institutionName: '',
    logoUrl: '',
    layoutConfig: {
      columnLayout: '2',
      themeColor: '#1a365d',
    }
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    // Validate input with zod schema
    const validationResult = templateSchema.safeParse(newTemplate);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Erro de validação',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }
    
    const validatedData = validationResult.data;

    try {
      // Gerar token compartilhável
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_share_token');

      if (tokenError) throw tokenError;

      const { error } = await supabase
        .from('banner_templates')
        .insert({
          title: validatedData.title,
          is_public: true,
          share_token: tokenData,
          default_logo_url: validatedData.logoUrl || null,
          default_institution_name: validatedData.institutionName || null,
          content: validatedData.layoutConfig,
          latex_template: '',
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Template criado com sucesso',
      });

      setIsCreateDialogOpen(false);
      setNewTemplate({
        title: '',
        institutionName: '',
        logoUrl: '',
        layoutConfig: {
          columnLayout: '2',
          themeColor: '#1a365d',
        }
      });
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o template',
        variant: 'destructive',
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banner_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Template excluído com sucesso',
      });

      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o template',
        variant: 'destructive',
      });
    }
  };

  const copyShareLink = (token: string) => {
    const link = `${window.location.origin}/banner/shared/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copiado',
      description: 'O link foi copiado para a área de transferência',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates Compartilháveis</h2>
          <p className="text-muted-foreground mt-1">
            Crie templates de banner que podem ser acessados por link
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Template Compartilhável</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Título do Template *</Label>
                <Input
                  id="title"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  placeholder="Ex: Banner Padrão IFMS"
                />
              </div>

              <div>
                <Label htmlFor="institutionName">Nome da Instituição</Label>
                <Input
                  id="institutionName"
                  value={newTemplate.institutionName}
                  onChange={(e) => setNewTemplate({ ...newTemplate, institutionName: e.target.value })}
                  placeholder="Ex: Instituto Federal de Mato Grosso do Sul"
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">URL do Logo Padrão</Label>
                <Input
                  id="logoUrl"
                  value={newTemplate.logoUrl}
                  onChange={(e) => setNewTemplate({ ...newTemplate, logoUrl: e.target.value })}
                  placeholder="URL pública do logo (ex: https://...)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Insira uma URL pública de imagem que será o logo padrão
                </p>
              </div>

              <div>
                <Label htmlFor="columnLayout">Layout de Colunas</Label>
                <select
                  id="columnLayout"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newTemplate.layoutConfig.columnLayout}
                  onChange={(e) => setNewTemplate({
                    ...newTemplate,
                    layoutConfig: { ...newTemplate.layoutConfig, columnLayout: e.target.value }
                  })}
                >
                  <option value="2">2 Colunas</option>
                  <option value="3">3 Colunas</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createTemplate}>
                  Criar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-lg">{template.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.default_logo_url && (
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  <img
                    src={template.default_logo_url}
                    alt="Logo padrão"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              {template.default_institution_name && (
                <p className="text-sm text-muted-foreground">
                  {template.default_institution_name}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{template.views_count || 0} visualizações</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => copyShareLink(template.share_token)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/banner/shared/${template.share_token}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTemplate(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nenhum template compartilhável criado ainda.</p>
              <p className="text-sm mt-2">Clique em "Novo Template" para começar.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
