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

interface IFMSGuidelinesViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workType: "article" | "banner" | "monography" | "thesis";
}

const IFMSGuidelinesViewer = ({
  open,
  onOpenChange,
  workType,
}: IFMSGuidelinesViewerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Regras IFMS para Trabalhos Acadêmicos</DialogTitle>
          <DialogDescription>
            Normas de formatação do Instituto Federal de Mato Grosso do Sul
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
                <div>
                  <h4 className="font-semibold mb-2">📄 Papel e Margens</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Formato: A4 (21cm × 29,7cm)</li>
                    <li>Margem superior: 3cm</li>
                    <li>Margem inferior: 2cm</li>
                    <li>Margem esquerda: 3cm</li>
                    <li>Margem direita: 2cm</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">🔤 Fonte e Espaçamento</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Fonte: Times New Roman, tamanho 12</li>
                    <li>Espaçamento entre linhas: 1,5</li>
                    <li>Recuo de parágrafo: 1,25cm</li>
                    <li>Alinhamento: Justificado</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">📝 Citações Longas</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Citações com mais de 3 linhas</li>
                    <li>Recuo de 4cm da margem esquerda</li>
                    <li>Fonte: Times New Roman, tamanho 10</li>
                    <li>Espaçamento simples</li>
                    <li>Sem aspas</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">🔢 Numeração de Páginas</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Páginas pré-textuais: não numeradas</li>
                    <li>A partir da Introdução: numeração arábica</li>
                    <li>Localização: canto superior direito</li>
                    <li>Distância: 2cm da borda superior</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura do Trabalho</CardTitle>
                <CardDescription>
                  Ordem dos elementos conforme normas ABNT/IFMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workType === "article" && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2">📋 Elementos Pré-textuais</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Título e subtítulo (se houver)</li>
                        <li>Nome(s) do(s) autor(es)</li>
                        <li>Resumo em português (100-250 palavras)</li>
                        <li>Palavras-chave (3 a 5 palavras)</li>
                        <li>Abstract em inglês</li>
                        <li>Keywords em inglês</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">📖 Elementos Textuais</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>1 Introdução</li>
                        <li>2 Referencial Teórico (ou Fundamentação Teórica)</li>
                        <li>2.1, 2.2... Subtópicos teóricos</li>
                        <li>3 Metodologia (ou Procedimentos Metodológicos)</li>
                        <li>4 Resultados e Discussão</li>
                        <li>5 Conclusão (ou Considerações Finais)</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">📚 Elementos Pós-textuais</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Referências (obrigatório)</li>
                        <li>Apêndices (opcional)</li>
                        <li>Anexos (opcional)</li>
                      </ul>
                    </div>
                  </>
                )}

                {workType === "banner" && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-2">🎯 Estrutura do Banner</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Título: centralizado, fonte grande</li>
                        <li>Autores e instituição: abaixo do título</li>
                        <li>Introdução: contextualização breve</li>
                        <li>Objetivos: claro e direto</li>
                        <li>Metodologia: resumida</li>
                        <li>Resultados: principais achados</li>
                        <li>Conclusão: síntese dos resultados</li>
                        <li>Referências: principais fontes</li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">🎨 Layout e Design</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Formato A4 vertical ou horizontal</li>
                        <li>Layout em 2 ou 3 colunas</li>
                        <li>Uso equilibrado de imagens e texto</li>
                        <li>Fonte legível à distância (mínimo 20pt)</li>
                        <li>Cores institucionais ou tema coerente</li>
                      </ul>
                    </div>
                  </>
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
                <div>
                  <h4 className="font-semibold mb-2">📚 Livro</h4>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    SOBRENOME, Nome. <strong>Título da obra</strong>: subtítulo. Edição. Local: Editora, ano.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exemplo: GIL, Antonio Carlos. <strong>Como elaborar projetos de pesquisa</strong>. 6. ed. São Paulo: Atlas, 2017.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">📄 Artigo de Periódico</h4>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    SOBRENOME, Nome. Título do artigo. <strong>Título do periódico</strong>, Local, v. X, n. Y, p. X-Y, mês ano.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exemplo: SILVA, João. Metodologias ativas no ensino. <strong>Revista Educação</strong>, São Paulo, v. 15, n. 2, p. 45-60, jul. 2020.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">🌐 Documento Online</h4>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    SOBRENOME, Nome. <strong>Título</strong>. Local, ano. Disponível em: &lt;URL&gt;. Acesso em: data.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exemplo: BRASIL. <strong>Lei nº 9.394</strong>, de 20 de dezembro de 1996. Brasília, 1996. Disponível em: &lt;http://www.planalto.gov.br&gt;. Acesso em: 15 jan. 2024.
                  </p>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Dicas Importantes</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>Ordem alfabética por sobrenome do autor</li>
                    <li>Alinhamento à esquerda</li>
                    <li>Espaçamento simples dentro da referência</li>
                    <li>Uma linha em branco entre referências</li>
                    <li>Título da obra em negrito</li>
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

export default IFMSGuidelinesViewer;
