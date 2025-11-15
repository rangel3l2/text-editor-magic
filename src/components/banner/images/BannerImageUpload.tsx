import { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BannerImageUploadProps {
  onUpload: (file: File) => Promise<void>;
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (currentCount >= maxImages) {
        break;
      }
      await onUpload(file);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const canUpload = currentCount < maxImages;

  return (
    <Card className={!canUpload ? 'opacity-50' : ''}>
      <CardContent className="p-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,application/pdf"
          multiple
          onChange={handleFileChange}
          disabled={isUploading || !canUpload}
          className="hidden"
          id="banner-image-upload"
        />
        
        <label htmlFor="banner-image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                {isUploading ? 'Enviando imagem...' : 'Adicionar Imagens'}
              </p>
              <p className="text-sm text-muted-foreground">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG ou PDF • Máximo {maxImages} imagens
              </p>
              {!canUpload && (
                <p className="text-xs text-destructive font-semibold">
                  Limite de imagens atingido
                </p>
              )}
            </div>

            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={isUploading || !canUpload}
              onClick={(e) => {
                e.preventDefault();
                inputRef.current?.click();
              }}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </Button>
          </div>
        </label>

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
            Legendas serão numeradas automaticamente
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BannerImageUpload;
