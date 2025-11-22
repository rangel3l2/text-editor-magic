import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SharePermission, WorkShare } from '@/hooks/useWorkSharing';
import { Copy, Trash2, Eye, Edit, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workId: string;
  shareToken: string | null;
  shares: WorkShare[];
  onGenerateLink: () => Promise<string | null>;
  onShareWork: (email: string, permission: SharePermission) => Promise<void>;
  onUpdateShare: (shareId: string, permission: SharePermission) => Promise<void>;
  onRemoveShare: (shareId: string) => Promise<void>;
}

const ShareDialog = ({
  open,
  onOpenChange,
  workId,
  shareToken,
  shares,
  onGenerateLink,
  onShareWork,
  onUpdateShare,
  onRemoveShare,
}: ShareDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('viewer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const getShareLink = () => {
    return shareToken ? `${window.location.origin}/banner/${workId}?token=${shareToken}` : null;
  };

  const handleCopyLink = async () => {
    setIsGenerating(true);
    try {
      const token = shareToken || await onGenerateLink();
      if (token) {
        const link = `${window.location.origin}/banner/${workId}?token=${token}`;
        await navigator.clipboard.writeText(link);
        toast({
          title: 'Link copiado',
          description: 'O link de compartilhamento foi copiado para a área de transferência',
        });
      }
    } catch (error) {
      console.error('Erro ao copiar link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, insira um email',
        variant: 'destructive',
      });
      return;
    }

    setIsSharing(true);
    try {
      await onShareWork(email, permission);
      setEmail('');
      setPermission('viewer');
    } finally {
      setIsSharing(false);
    }
  };

  const getPermissionIcon = (perm: SharePermission) => {
    switch (perm) {
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      case 'editor':
        return <Edit className="w-4 h-4" />;
      case 'commenter':
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPermissionLabel = (perm: SharePermission) => {
    switch (perm) {
      case 'viewer':
        return 'Visualizador';
      case 'editor':
        return 'Editor';
      case 'commenter':
        return 'Comentador';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Trabalho</DialogTitle>
          <DialogDescription>
            Compartilhe este trabalho com outras pessoas para colaboração em tempo real
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link de compartilhamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Link de compartilhamento</label>
            <div className="flex gap-2">
              <Input 
                value={getShareLink() || 'Gerar link...'} 
                readOnly 
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handleCopyLink}
                disabled={isGenerating}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Qualquer pessoa com este link pode acessar o trabalho
            </p>
          </div>

          {/* Adicionar colaborador */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Convidar por email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={permission} onValueChange={(value) => setPermission(value as SharePermission)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Visualizador
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Editor
                    </div>
                  </SelectItem>
                  <SelectItem value="commenter">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comentador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={isSharing}>
                Convidar
              </Button>
            </div>
          </div>

          {/* Lista de compartilhamentos */}
          {shares.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Pessoas com acesso</label>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      {getPermissionIcon(share.permission)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{share.shared_with_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {getPermissionLabel(share.permission)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={share.permission}
                        onValueChange={(value) => onUpdateShare(share.id, value as SharePermission)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Visualizador</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="commenter">Comentador</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveShare(share.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;