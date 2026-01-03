import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, ChevronDown, ChevronUp, Lightbulb, Quote, Copy, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CitationGuideProps {
  sectionName: string;
}

export default function CitationGuide({ sectionName }: CitationGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExample(id);
    setTimeout(() => setCopiedExample(null), 2000);
    toast({
      title: 'Copiado!',
      description: 'Cole no texto onde deseja inserir a citação.',
    });
  };

  const examples = {
    indirect: {
      narrative: [
        'Silva (2023) afirma que a educação é fundamental para o desenvolvimento.',
        'De acordo com Santos e Oliveira (2022), a metodologia ativa promove a aprendizagem.',
        'Freire et al. (2021) destacam a importância da prática reflexiva.',
      ],
      parenthetical: [
        'A educação é fundamental para o desenvolvimento (SILVA, 2023).',
        'A metodologia ativa promove a aprendizagem (SANTOS; OLIVEIRA, 2022).',
        'A prática reflexiva é essencial (FREIRE et al., 2021).',
      ],
    },
    directShort: [
      '"A educação transforma a sociedade" (SILVA, 2023, p. 45).',
      'Segundo Santos (2022, p. 12), "a metodologia ativa é eficaz".',
    ],
    directLong: `Para citações com mais de 3 linhas, use um bloco recuado:

    A educação não é apenas a transmissão de conhecimentos, mas sim um 
    processo de construção coletiva que envolve todos os atores sociais 
    na busca por uma sociedade mais justa e igualitária. (FREIRE, 1996, p. 34)`,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mb-4">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between text-left bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200">
                📚 Como citar autores nesta seção? (Clique para aprender)
              </span>
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
            <CardContent className="pt-4 space-y-4">
              {/* Introdução */}
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-800">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Na seção de <span className="text-blue-600 dark:text-blue-400">{sectionName}</span>, você deve citar os autores que fundamentam seu texto.
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Existem dois tipos principais de citação: <strong>indireta</strong> (paráfrase) e <strong>direta</strong> (transcrição literal).
                  </p>
                </div>
              </div>

              {/* Citação Indireta */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    Tipo 1
                  </Badge>
                  <h4 className="font-semibold">Citação Indireta (Paráfrase)</h4>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Quando você explica a ideia de um autor com suas próprias palavras. <strong>Não precisa de aspas nem página.</strong>
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  {/* Narrativa */}
                  <div className="p-3 bg-white dark:bg-background rounded border">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                      📝 Formato Narrativo (autor fora dos parênteses):
                    </p>
                    <div className="space-y-2">
                      {examples.indirect.narrative.map((ex, i) => (
                        <div key={`narrative-${i}`} className="flex items-center justify-between gap-2 text-xs">
                          <p className="font-mono bg-muted p-1.5 rounded flex-1">{ex}</p>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(ex, `narrative-${i}`)}
                          >
                            {copiedExample === `narrative-${i}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                      <p className="font-medium text-green-800 dark:text-green-200">🧠 Memorize:</p>
                      <p className="text-green-700 dark:text-green-300 font-mono">
                        Autor (ANO) + verbo + ideia
                      </p>
                    </div>
                  </div>

                  {/* Parentético */}
                  <div className="p-3 bg-white dark:bg-background rounded border">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                      📝 Formato Parentético (autor dentro dos parênteses):
                    </p>
                    <div className="space-y-2">
                      {examples.indirect.parenthetical.map((ex, i) => (
                        <div key={`parent-${i}`} className="flex items-center justify-between gap-2 text-xs">
                          <p className="font-mono bg-muted p-1.5 rounded flex-1">{ex}</p>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(ex, `parent-${i}`)}
                          >
                            {copiedExample === `parent-${i}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-200">🧠 Memorize:</p>
                      <p className="text-blue-700 dark:text-blue-300 font-mono">
                        Ideia + (SOBRENOME, ANO)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citação Direta */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                    Tipo 2
                  </Badge>
                  <h4 className="font-semibold">Citação Direta (Transcrição)</h4>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Quando você copia o texto exatamente como o autor escreveu. <strong>Precisa de aspas e número da página.</strong>
                </p>

                {/* Direta curta */}
                <div className="p-3 bg-white dark:bg-background rounded border">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                    📝 Citação Direta Curta (até 3 linhas): mantém no parágrafo com aspas
                  </p>
                  <div className="space-y-2">
                    {examples.directShort.map((ex, i) => (
                      <div key={`direct-${i}`} className="flex items-center justify-between gap-2 text-xs">
                        <p className="font-mono bg-muted p-1.5 rounded flex-1">{ex}</p>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(ex, `direct-${i}`)}
                        >
                          {copiedExample === `direct-${i}` ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                    <p className="font-medium text-purple-800 dark:text-purple-200">🧠 Memorize:</p>
                    <p className="text-purple-700 dark:text-purple-300 font-mono">
                      "texto copiado" (SOBRENOME, ANO, p. XX)
                    </p>
                  </div>
                </div>

                {/* Direta longa */}
                <div className="p-3 bg-white dark:bg-background rounded border">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                    📝 Citação Direta Longa (+3 linhas): bloco separado, recuado 4cm, sem aspas
                  </p>
                  <div className="text-xs font-mono bg-muted p-3 rounded whitespace-pre-line">
                    {examples.directLong}
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                    <p className="font-medium text-amber-800 dark:text-amber-200">🧠 Memorize:</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Bloco recuado + texto sem aspas + (SOBRENOME, ANO, p. XX)
                    </p>
                  </div>
                </div>
              </div>

              {/* Dica final */}
              <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <Quote className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  💡 Dica importante
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                  Após citar um autor no texto, você <strong>deve</strong> adicioná-lo na seção de Referências. 
                  O sistema só permite adicionar referências de autores que já foram citados no texto!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}