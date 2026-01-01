import { useState } from 'react';
import { Reference, CitationType, CitationFormat } from '@/types/reference';
import { generateCitation } from '@/services/referenceFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Quote, Copy, Check, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CitationToolProps {
  references: Reference[];
  onInsertCitation: (citationText: string) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function CitationTool({
  references,
  onInsertCitation,
  trigger,
  disabled = false,
}: CitationToolProps) {
  const [open, setOpen] = useState(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>('');
  const [citationType, setCitationType] = useState<CitationType>('indirect');
  const [citationFormat, setCitationFormat] = useState<CitationFormat>('parenthetical');
  const [page, setPage] = useState('');
  const [quotedText, setQuotedText] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedReference = references.find(r => r.id === selectedReferenceId);

  const handleReset = () => {
    setSelectedReferenceId('');
    setCitationType('indirect');
    setCitationFormat('parenthetical');
    setPage('');
    setQuotedText('');
  };

  const handleClose = () => {
    setOpen(false);
    handleReset();
  };

  const generatePreview = (): string => {
    if (!selectedReference) return '';
    
    return generateCitation(
      selectedReference,
      citationType,
      citationFormat,
      page || undefined,
      quotedText || undefined
    );
  };

  const handleInsert = () => {
    const citation = generatePreview();
    if (!citation) {
      toast({
        title: 'Selecione uma referência',
        description: 'Por favor, selecione uma referência para criar a citação.',
        variant: 'destructive',
      });
      return;
    }

    onInsertCitation(citation);
    
    toast({
      title: 'Citação inserida',
      description: 'A citação foi adicionada ao texto.',
    });
    
    handleClose();
  };

  const handleCopy = () => {
    const citation = generatePreview();
    if (citation) {
      navigator.clipboard.writeText(citation.replace(/<[^>]*>/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Citação copiada',
        description: 'Cole a citação onde desejar no texto.',
      });
    }
  };

  const preview = generatePreview();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={disabled || references.length === 0}>
            <Quote className="h-4 w-4 mr-2" />
            Inserir Citação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Inserir Citação ABNT
          </DialogTitle>
          <DialogDescription>
            Selecione uma referência e configure o formato da citação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {references.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você ainda não tem referências cadastradas. Adicione referências primeiro para poder citá-las.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Seleção de referência */}
              <div className="space-y-2">
                <Label>Selecione a referência</Label>
                <Select
                  value={selectedReferenceId}
                  onValueChange={setSelectedReferenceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma referência..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="max-h-[200px]">
                      {references.map(ref => (
                        <SelectItem key={ref.id} value={ref.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {ref.authors[0]?.split(',')[0]}
                            </span>
                            <span>({ref.year})</span>
                            <span className="truncate max-w-[200px]">
                              – {ref.title}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {selectedReference && (
                <>
                  {/* Tipo de citação */}
                  <div className="space-y-3">
                    <Label>Tipo de citação</Label>
                    <RadioGroup
                      value={citationType}
                      onValueChange={v => setCitationType(v as CitationType)}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="indirect" id="indirect" />
                        <div className="flex-1">
                          <Label htmlFor="indirect" className="cursor-pointer font-medium">
                            Citação Indireta
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Paráfrase do autor, sem aspas. Ex: (SILVA, 2023) ou Silva (2023)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="direct-short" id="direct-short" />
                        <div className="flex-1">
                          <Label htmlFor="direct-short" className="cursor-pointer font-medium">
                            Citação Direta Curta
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Até 3 linhas, entre aspas no corpo do texto.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="direct-long" id="direct-long" />
                        <div className="flex-1">
                          <Label htmlFor="direct-long" className="cursor-pointer font-medium">
                            Citação Direta Longa
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Mais de 3 linhas, em bloco recuado, sem aspas.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Formato da citação */}
                  <div className="space-y-3">
                    <Label>Formato</Label>
                    <RadioGroup
                      value={citationFormat}
                      onValueChange={v => setCitationFormat(v as CitationFormat)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="parenthetical" id="parenthetical" />
                        <Label htmlFor="parenthetical" className="cursor-pointer">
                          Parentética: (SILVA, 2023)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="narrative" id="narrative" />
                        <Label htmlFor="narrative" className="cursor-pointer">
                          Narrativa: Silva (2023)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campos para citação direta */}
                  {(citationType === 'direct-short' || citationType === 'direct-long') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="page">Página(s)</Label>
                        <Input
                          id="page"
                          value={page}
                          onChange={e => setPage(e.target.value)}
                          placeholder="Ex: 45 ou 45-50"
                          className="max-w-[150px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quotedText">Texto citado (opcional)</Label>
                        <Textarea
                          id="quotedText"
                          value={quotedText}
                          onChange={e => setQuotedText(e.target.value)}
                          placeholder="Cole ou digite o trecho a ser citado..."
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Se preenchido, a citação será formatada com o texto.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Preview */}
                  {preview && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <Label className="text-sm font-medium">Prévia da citação:</Label>
                      <p 
                        className={cn(
                          "text-sm",
                          citationType === 'direct-long' && "pl-8 text-[11px] leading-tight"
                        )}
                        dangerouslySetInnerHTML={{ __html: preview }}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {preview && (
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={handleInsert}
            disabled={!selectedReference}
          >
            <Quote className="h-4 w-4 mr-2" />
            Inserir no Texto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente de botão flutuante para inserir citação em qualquer editor
export function CitationButton({
  references,
  onInsertCitation,
  disabled = false,
}: Omit<CitationToolProps, 'trigger'>) {
  return (
    <CitationTool
      references={references}
      onInsertCitation={onInsertCitation}
      disabled={disabled}
      trigger={
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          disabled={disabled || references.length === 0}
          title={references.length === 0 ? "Adicione referências primeiro" : "Inserir citação ABNT"}
        >
          <Quote className="h-4 w-4" />
        </Button>
      }
    />
  );
}
