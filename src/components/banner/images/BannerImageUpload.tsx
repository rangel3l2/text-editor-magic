import { useRef, useState } from 'react';
import { Clipboard, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BannerImageUploadProps {
  onUpload: (file: File, imageType: 'figura' | 'grafico' | 'tabela', title: string, source: string, section: string) => Promise<void>;
  isUploading: boolean;
  maxImages?: number;
  currentCount?: number;
  figuraCount?: number;
  graficoCount?: number;
  tabelaCount?: number;
  defaultSection?: string; // Seção pré-selecionada (quando inserindo via menu de contexto)
  defaultType?: 'figura' | 'grafico' | 'tabela'; // Tipo pré-selecionado
}

const BannerImageUpload = ({ 
  onUpload, 
  isUploading, 
  maxImages = 10,
  currentCount = 0,
  figuraCount = 0,
  graficoCount = 0,
  tabelaCount = 0,
  defaultSection,
  defaultType = 'figura'
}: BannerImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'figura' | 'grafico' | 'tabela'>(defaultType);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [section, setSection] = useState(defaultSection || 'results');

  const getNextNumber = (type: 'figura' | 'grafico' | 'tabela') => {
    switch(type) {
      case 'figura': return figuraCount + 1;
      case 'grafico': return graficoCount + 1;
      case 'tabela': return tabelaCount + 1;
    }
  };

  const getTypeLabel = (type: 'figura' | 'grafico' | 'tabela') => {
    switch(type) {
      case 'figura': return 'Figura';
      case 'grafico': return 'Gráfico';
      case 'tabela': return 'Tabela';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0 && currentCount < maxImages) {
      setPendingImage(files[0]);
      // Só reseta o tipo se não houver um defaultType
      if (!defaultType) {
        setImageType('figura');
      }
      setShowTitleDialog(true);
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
          // Só reseta o tipo se não houver um defaultType
          if (!defaultType) {
            setImageType('figura');
          }
          setShowTitleDialog(true);
          return;
        }
      }
      
      alert('Nenhuma imagem encontrada na área de transferência');
    } catch (error) {
      console.error('Erro ao colar imagem:', error);
      alert('Erro ao acessar a área de transferência. Certifique-se de copiar uma imagem primeiro.');
    }
  };

  const handleConfirmTitle = () => {
    if (title.trim()) {
      setShowTitleDialog(false);
      setShowSourceDialog(true);
    }
  };

  const handleConfirmSource = async () => {
    if (pendingImage && title.trim() && source.trim()) {
      await onUpload(pendingImage, imageType, title.trim(), source.trim(), section);
      setShowSourceDialog(false);
      setPendingImage(null);
      setTitle('');
      setSource('');
      setImageType('figura');
      setSection('results');
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

      {/* Dialog 1: Título da Imagem */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título da Imagem</DialogTitle>
            <DialogDescription>
              Selecione o tipo e insira o título. A numeração será adicionada automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-imageType">Tipo</Label>
              {defaultType ? (
                <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                  {imageType === 'figura' && `Figura ${getNextNumber('figura')}`}
                  {imageType === 'grafico' && `Gráfico ${getNextNumber('grafico')}`}
                  {imageType === 'tabela' && `Tabela ${getNextNumber('tabela')}`}
                  <p className="text-xs text-muted-foreground mt-1">
                    Tipo selecionado automaticamente
                  </p>
                </div>
              ) : (
                <Select value={imageType} onValueChange={(v) => setImageType(v as any)}>
                  <SelectTrigger id="upload-imageType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="figura">Figura {getNextNumber('figura')}</SelectItem>
                    <SelectItem value="grafico">Gráfico {getNextNumber('grafico')}</SelectItem>
                    <SelectItem value="tabela">Tabela {getNextNumber('tabela')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder={`${getTypeLabel(imageType)} ${getNextNumber(imageType)}: `}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Será exibido como: {getTypeLabel(imageType)} {getNextNumber(imageType)}: {title || '...'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTitleDialog(false);
                setPendingImage(null);
                setTitle('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTitle}
              disabled={!title.trim()}
            >
              Próximo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Fonte da Imagem */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fonte da Imagem</DialogTitle>
            <DialogDescription>
              Informe a fonte ou origem desta imagem (será exibida abaixo da imagem).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-section">Seção onde a imagem aparecerá</Label>
              {defaultSection ? (
                <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                  {section === 'introduction' && 'Introdução'}
                  {section === 'objectives' && 'Objetivos'}
                  {section === 'methodology' && 'Metodologia'}
                  {section === 'results' && 'Resultados'}
                  {section === 'discussion' && 'Discussão'}
                  {section === 'conclusion' && 'Conclusão'}
                  <p className="text-xs text-muted-foreground mt-1">
                    Inserindo na seção onde você clicou
                  </p>
                </div>
              ) : (
                <>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger id="upload-section">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="introduction">Introdução</SelectItem>
                      <SelectItem value="objectives">Objetivos</SelectItem>
                      <SelectItem value="methodology">Metodologia</SelectItem>
                      <SelectItem value="results">Resultados</SelectItem>
                      <SelectItem value="discussion">Discussão</SelectItem>
                      <SelectItem value="conclusion">Conclusão</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    A imagem será posicionada no final da seção selecionada
                  </p>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Fonte</Label>
              <Input
                id="source"
                placeholder="Ex: Adaptado de Silva et al. (2023)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSourceDialog(false);
                setShowTitleDialog(true);
              }}
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirmSource}
              disabled={!source.trim()}
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
