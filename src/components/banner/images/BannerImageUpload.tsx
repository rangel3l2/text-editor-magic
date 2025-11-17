import { useRef, useState } from 'react';
import { Clipboard, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BannerImageUploadProps {
  onUpload: (file: File, caption?: string) => Promise<void>;
  isUploading: boolean;
  maxImages?: number;
  currentCount?: number;
}

const BannerImageUpload = ({ 
  onUpload, 
  isUploading, 
  maxImages = 10,
  currentCount = 0 
}: BannerImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0 && currentCount < maxImages) {
      setPendingImage(files[0]);
      setShowCaptionDialog(true);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const file = new File([blob], `imagem-${Date.now()}.png`, { type: blob.type });
          
          setPendingImage(file);
          setShowCaptionDialog(true);
          return;
        }
      }
      
      alert('Nenhuma imagem encontrada na área de transferência');
    } catch (error) {
      console.error('Erro ao colar imagem:', error);
      alert('Erro ao acessar a área de transferência. Certifique-se de copiar uma imagem primeiro.');
    }
  };

  const handleConfirmCaption = async () => {
    if (pendingImage && caption.trim()) {
      await onUpload(pendingImage, caption.trim());
      setShowCaptionDialog(false);
      setPendingImage(null);
      setCaption('');
    }
  };

  const canUpload = currentCount < maxImages;

  return (
    <>
      <Card className={!canUpload ? 'opacity-50' : ''}>
        <CardContent className="p-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,application/pdf"
            onChange={handleFileChange}
            disabled={isUploading || !canUpload}
            className="hidden"
            id="banner-image-upload"
          />
          
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={isUploading || !canUpload}
              onClick={handlePaste}
              className="w-full"
            >
              <Clipboard className="w-5 h-5 mr-2" />
              Colar Imagem da Área de Transferência
            </Button>

            <label htmlFor="banner-image-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isUploading || !canUpload}
                onClick={(e) => {
                  e.preventDefault();
                  inputRef.current?.click();
                }}
                className="w-full"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Selecionar Arquivo
              </Button>
            </label>
          </div>

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Recomendado: Imagens com 300 DPI
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Máximo 10MB por arquivo
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Numeração automática: Figura 1, 2, 3...
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCaptionDialog} onOpenChange={setShowCaptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar legenda</DialogTitle>
            <DialogDescription>
              Descreva o conteúdo desta imagem. A numeração (Figura 1, 2, 3...) será adicionada automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda da imagem</Label>
              <Input
                id="caption"
                placeholder="Ex: Resultados do experimento A mostrando..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCaptionDialog(false);
                setPendingImage(null);
                setCaption('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCaption}
              disabled={!caption.trim()}
            >
              Adicionar Imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BannerImageUpload;
