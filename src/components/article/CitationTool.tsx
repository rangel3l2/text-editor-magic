import { useState, useMemo } from 'react';
import { Reference, CitationType, CitationFormat } from '@/types/reference';
import { generateCitation } from '@/services/referenceFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Quote, Copy, Check, AlertCircle, Lightbulb, GraduationCap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CitationToolProps {
  references: Reference[];
  onInsertCitation: (citationText: string) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

// Dicas educativas baseadas na Teoria do Andaime
const scaffoldingTips = {
  indirect: {
    title: '📚 Citação Indireta (Paráfrase)',
    description: 'Você reescreve a ideia do autor com suas próprias palavras.',
    rule: 'Não usa aspas, mas SEMPRE indica a fonte.',
    examples: [
      { format: 'parenthetical', text: 'Segundo estudos recentes, a leitura melhora a cognição (SILVA, 2023).' },
      { format: 'narrative', text: 'Silva (2023) afirma que a leitura melhora a cognição.' },
    ],
    memorize: 'SOBRENOME em MAIÚSCULO + vírgula + ano. Dentro de parênteses ou com o ano entre parênteses.',
  },
  'direct-short': {
    title: '📖 Citação Direta Curta (até 3 linhas)',
    description: 'Você copia exatamente o que o autor escreveu, até 3 linhas.',
    rule: 'Usa aspas duplas e indica página.',
    examples: [
      { format: 'parenthetical', text: '"A educação é a arma mais poderosa" (MANDELA, 2003, p. 45).' },
      { format: 'narrative', text: 'Para Mandela (2003, p. 45), "a educação é a arma mais poderosa".' },
    ],
    memorize: 'Texto entre "aspas duplas" + (AUTOR, ano, p. XX). A página é OBRIGATÓRIA!',
  },
  'direct-long': {
    title: '📜 Citação Direta Longa (mais de 3 linhas)',
    description: 'Citações com mais de 3 linhas devem ficar em bloco separado, com formatação especial.',
    rule: 'Recuo de 4cm da margem esquerda, fonte 10pt, espaçamento simples, sem aspas, sem recuo de primeira linha.',
    examples: [
      { format: 'block', text: `A aprendizagem significativa ocorre quando o aluno consegue relacionar 
novos conceitos com conhecimentos prévios, criando conexões mentais 
duradouras que permitem a transferência do conhecimento para novas 
situações do cotidiano. (AUSUBEL, 1968, p. 78)` },
    ],
    memorize: '🎯 5 regras: Recuo 4cm + Fonte 10pt + Espaço simples + SEM aspas + (AUTOR, ano, p. XX) no final',
    formatting: {
      indent: '4cm da margem esquerda',
      font: 'Tamanho 10pt (menor que o texto normal de 12pt)',
      spacing: 'Espaçamento simples entre linhas',
      quotes: 'NÃO usar aspas',
      firstLine: 'SEM recuo de primeira linha',
      citation: '(SOBRENOME, ano, p. XX) no final do bloco'
    }
  },
};

const formatExplanation = {
  parenthetical: {
    name: 'Citação Parentética',
    when: 'Use quando o foco está na informação, não no autor.',
    pattern: '...afirmação do autor (SOBRENOME, ano).',
    example: 'O cérebro processa imagens mais rápido que texto (SILVA, 2020).',
  },
  narrative: {
    name: 'Citação Narrativa',
    when: 'Use quando você quer destacar o autor na sua argumentação.',
    pattern: 'Sobrenome (ano) afirma que...',
    example: 'Segundo Silva (2020), o cérebro processa imagens mais rápido que texto.',
  },
};

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
  const [showLearningTips, setShowLearningTips] = useState(true);
  const [showFormatHelp, setShowFormatHelp] = useState(false);

  const selectedReference = references.find(r => r.id === selectedReferenceId);
  const currentTip = scaffoldingTips[citationType];
  const currentFormatTip = formatExplanation[citationFormat];

  // Gera explicação de como memorizar o padrão atual
  const howToMemorize = useMemo(() => {
    if (!selectedReference) return '';
    
    const authorSurname = selectedReference.authors[0]?.split(',')[0]?.toUpperCase() || 'AUTOR';
    const year = selectedReference.year || 'ano';
    
    if (citationType === 'indirect') {
      if (citationFormat === 'parenthetical') {
        return `Para citar ${authorSurname}, escreva sua ideia e adicione no final: (${authorSurname}, ${year})`;
      } else {
        return `Para citar ${authorSurname}, comece com: ${authorSurname.charAt(0) + authorSurname.slice(1).toLowerCase()} (${year}) afirma que...`;
      }
    } else {
      const pageText = page || 'XX';
      if (citationFormat === 'parenthetical') {
        return `Copie o texto entre aspas e adicione: (${authorSurname}, ${year}, p. ${pageText})`;
      } else {
        return `Comece com: Segundo ${authorSurname.charAt(0) + authorSurname.slice(1).toLowerCase()} (${year}, p. ${pageText}), "texto citado".`;
      }
    }
  }, [selectedReference, citationType, citationFormat, page]);

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
      title: 'Citação inserida! 📚',
      description: howToMemorize,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Inserir Citação ABNT
          </DialogTitle>
          <DialogDescription>
            Aprenda a formatar citações corretamente enquanto cria seu trabalho.
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
              {/* Seção de Aprendizado - Collapsible */}
              <Collapsible open={showLearningTips} onOpenChange={setShowLearningTips}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-primary/5 hover:bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">Aprenda: {currentTip.title}</span>
                    </div>
                    {showLearningTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-primary/20">
                    <p className="text-sm text-muted-foreground">{currentTip.description}</p>
                    
                    <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                      <Lightbulb className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Regra ABNT:</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{currentTip.rule}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Exemplos:</p>
                      {currentTip.examples.map((ex, i) => (
                        <div key={i} className="text-sm p-2 bg-background rounded border">
                          <Badge variant="outline" className="text-xs mb-1">{ex.format}</Badge>
                          <p className="italic">{ex.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                      <BookOpen className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">🧠 Memorize:</p>
                        <p className="text-sm text-green-700 dark:text-green-300 font-mono">{currentTip.memorize}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Seleção de referência */}
              <div className="space-y-2">
                <Label>Selecione a referência que você está citando</Label>
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
                            <span className="font-medium">
                              {ref.authors[0]?.split(',')[0]}
                            </span>
                            <span className="text-muted-foreground">({ref.year})</span>
                            <span className="truncate max-w-[200px] text-muted-foreground">
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
                  {/* Tipo de citação com explicações educativas */}
                  <div className="space-y-3">
                    <Label>Que tipo de citação você vai fazer?</Label>
                    <RadioGroup
                      value={citationType}
                      onValueChange={v => setCitationType(v as CitationType)}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className={cn(
                        "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        citationType === 'indirect' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      )}>
                        <RadioGroupItem value="indirect" id="indirect" />
                        <div className="flex-1">
                          <Label htmlFor="indirect" className="cursor-pointer font-medium">
                            Citação Indireta (paráfrase)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Você reescreve a ideia do autor com suas palavras. <span className="text-primary font-medium">Não precisa de página.</span>
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        citationType === 'direct-short' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      )}>
                        <RadioGroupItem value="direct-short" id="direct-short" />
                        <div className="flex-1">
                          <Label htmlFor="direct-short" className="cursor-pointer font-medium">
                            Citação Direta Curta (até 3 linhas)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Copia exatamente o texto, entre aspas. <span className="text-orange-600 font-medium">Página obrigatória!</span>
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        citationType === 'direct-long' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      )}>
                        <RadioGroupItem value="direct-long" id="direct-long" />
                        <div className="flex-1">
                          <Label htmlFor="direct-long" className="cursor-pointer font-medium">
                            Citação Direta Longa (mais de 3 linhas)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Bloco recuado 4cm, fonte 10pt, espaço simples, sem aspas. <span className="text-orange-600 font-medium">Página obrigatória!</span>
                          </p>
                          {citationType === 'direct-long' && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs space-y-1">
                              <p className="font-medium text-amber-800 dark:text-amber-200">📐 Formatação ABNT/IFMS:</p>
                              <ul className="text-amber-700 dark:text-amber-300 space-y-0.5 list-disc list-inside">
                                <li>Recuo de 4cm da margem esquerda</li>
                                <li>Fonte tamanho 10pt (menor que 12pt normal)</li>
                                <li>Espaçamento simples entre linhas</li>
                                <li>SEM aspas (diferente da citação curta)</li>
                                <li>SEM recuo de primeira linha</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Formato da citação com explicação */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Como você quer posicionar a citação?</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowFormatHelp(!showFormatHelp)}
                        className="text-xs text-muted-foreground"
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        {showFormatHelp ? 'Ocultar ajuda' : 'Ver explicação'}
                      </Button>
                    </div>
                    
                    {showFormatHelp && (
                      <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Parentética</p>
                          <p className="text-blue-600 dark:text-blue-300 text-xs">{formatExplanation.parenthetical.when}</p>
                          <p className="italic text-xs mt-1">Ex: {formatExplanation.parenthetical.example}</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Narrativa</p>
                          <p className="text-blue-600 dark:text-blue-300 text-xs">{formatExplanation.narrative.when}</p>
                          <p className="italic text-xs mt-1">Ex: {formatExplanation.narrative.example}</p>
                        </div>
                      </div>
                    )}

                    <RadioGroup
                      value={citationFormat}
                      onValueChange={v => setCitationFormat(v as CitationFormat)}
                      className="flex gap-4"
                    >
                      <div className={cn(
                        "flex items-center space-x-2 p-2 rounded-md",
                        citationFormat === 'parenthetical' && "bg-primary/10"
                      )}>
                        <RadioGroupItem value="parenthetical" id="parenthetical" />
                        <Label htmlFor="parenthetical" className="cursor-pointer">
                          (SOBRENOME, ano)
                        </Label>
                      </div>
                      <div className={cn(
                        "flex items-center space-x-2 p-2 rounded-md",
                        citationFormat === 'narrative' && "bg-primary/10"
                      )}>
                        <RadioGroupItem value="narrative" id="narrative" />
                        <Label htmlFor="narrative" className="cursor-pointer">
                          Sobrenome (ano)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campos para citação direta */}
                  {(citationType === 'direct-short' || citationType === 'direct-long') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="page" className="flex items-center gap-2">
                          Página(s) 
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        </Label>
                        <Input
                          id="page"
                          value={page}
                          onChange={e => setPage(e.target.value)}
                          placeholder="Ex: 45 ou 45-50"
                          className="max-w-[150px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Na ABNT, citações diretas SEMPRE precisam de página. Se for online, use "n.p." (não paginado).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quotedText">Texto citado (opcional)</Label>
                        <Textarea
                          id="quotedText"
                          value={quotedText}
                          onChange={e => setQuotedText(e.target.value)}
                          placeholder="Cole ou digite o trecho exato a ser citado..."
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Se preenchido, o texto será formatado automaticamente com as aspas corretas.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Preview com explicação de como memorizar */}
                  {preview && (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Sua citação ficará assim:</Label>
                        <Badge variant="secondary" className="text-xs">Prévia ABNT</Badge>
                      </div>
                      
                      {/* Preview especial para citação longa */}
                      {citationType === 'direct-long' ? (
                        <div className="bg-background rounded border p-4">
                          <p className="text-xs text-muted-foreground mb-2 italic">
                            (Simulação visual - no documento real terá recuo de 4cm)
                          </p>
                          <div 
                            className="ml-12 text-[10pt] leading-tight text-justify border-l-2 border-primary/30 pl-3"
                            dangerouslySetInnerHTML={{ __html: preview.replace(/<div class="citacao-longa">|<\/div>/g, '') }}
                          />
                        </div>
                      ) : (
                        <p 
                          className="text-sm p-3 bg-background rounded border"
                          dangerouslySetInnerHTML={{ __html: preview }}
                        />
                      )}
                      
                      {/* Dica de memorização personalizada */}
                      <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                        <GraduationCap className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">Para fazer sozinho(a): </span>
                          <span className="text-green-700 dark:text-green-300">
                            {citationType === 'direct-long' 
                              ? `No Word: selecione o texto, aumente o recuo esquerdo para 4cm, mude fonte para 10pt, defina espaçamento simples.`
                              : howToMemorize
                            }
                          </span>
                        </div>
                      </div>

                      {/* Dica adicional para LaTeX/Overleaf */}
                      {citationType === 'direct-long' && (
                        <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                          <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-blue-800 dark:text-blue-200">No LaTeX/Overleaf: </span>
                            <span className="text-blue-700 dark:text-blue-300 font-mono">
                              \begin&#123;citacao&#125; ... \end&#123;citacao&#125;
                            </span>
                          </div>
                        </div>
                      )}
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
