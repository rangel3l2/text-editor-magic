import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getGuidelines, UniversityGuidelines } from "@/config/guidelines";

interface GuidelinesViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workType: "article" | "banner" | "monography" | "thesis";
  universityId?: string; // ID da universidade (padrão: 'ifms')
}

const GuidelinesViewer = ({
  open,
  onOpenChange,
  workType,
  universityId = 'ifms',
}: GuidelinesViewerProps) => {
  const guidelines = getGuidelines(universityId);

  if (!guidelines) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Erro ao Carregar Diretrizes</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar as diretrizes para a instituição selecionada.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const structureContent = guidelines.guidelines.structure[workType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Regras {guidelines.shortName} para Trabalhos Acadêmicos</DialogTitle>
          <DialogDescription>
            {guidelines.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="formatting" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="formatting">Formatação</TabsTrigger>
            <TabsTrigger value="structure">Estrutura</TabsTrigger>
            <TabsTrigger value="references">Referências</TabsTrigger>
          </TabsList>

          <TabsContent value="formatting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Formatação Geral</CardTitle>
                <CardDescription>
                  Regras de formatação aplicadas automaticamente pelo sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {guidelines.guidelines.formatting.map((section, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="my-4" />}
                    <h4 className="font-semibold mb-2">{section.title}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura do Trabalho</CardTitle>
                <CardDescription>
                  Ordem dos elementos conforme normas ABNT/{guidelines.shortName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {structureContent ? (
                  <>
                    {structureContent.map((section, index) => (
                      <div key={index}>
                        {index > 0 && <Separator className="my-4" />}
                        <h4 className="font-semibold mb-2">{section.title}</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className={item.startsWith('   •') ? 'ml-6' : ''}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Mostrar limites de páginas se disponível */}
                    {guidelines.pageLimits && guidelines.pageLimits[workType] && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                            📏 Limites de Páginas
                          </h4>
                          {workType === 'article' && guidelines.pageLimits.article && (
                            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                              <p>
                                <strong>Mínimo:</strong> {guidelines.pageLimits.article.min} páginas
                              </p>
                              <p>
                                <strong>Máximo:</strong> {guidelines.pageLimits.article.max} páginas
                              </p>
                              <p className="text-xs mt-2">
                                <strong>Observação:</strong> {guidelines.pageLimits.article.description}
                              </p>
                            </div>
                          )}
                          {workType === 'banner' && guidelines.pageLimits.banner && (
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {guidelines.pageLimits.banner.description}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Estrutura não disponível para este tipo de trabalho.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Referências (ABNT NBR 6023)</CardTitle>
                <CardDescription>
                  Exemplos de formatação de referências
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {guidelines.guidelines.references.examples.map((example, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="my-4" />}
                    <h4 className="font-semibold mb-2">{example.type}</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded whitespace-pre-wrap">
                      {example.format}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exemplo: {example.example}
                    </p>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    💡 Dicas Importantes
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    {guidelines.guidelines.references.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GuidelinesViewer;
