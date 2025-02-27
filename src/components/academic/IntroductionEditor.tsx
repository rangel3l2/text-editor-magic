
import { useState, useEffect } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface IntroductionEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  minLines?: number;
}

const IntroductionEditor = ({
  value,
  onChange,
  maxLines = 50,
  minLines = 10,
}: IntroductionEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>("guided");
  const [themePart, setThemePart] = useState<string>("");
  const [problemPart, setProblemPart] = useState<string>("");
  const [objectivesPart, setObjectivesPart] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Atualiza as partes quando o valor completo muda externamente
  useEffect(() => {
    if (activeTab === "guided" && value && !isProcessing) {
      extractPartsFromIntroduction();
    }
  }, [value, activeTab]);

  // Efeito para extrair as partes quando o componente é montado pela primeira vez
  useEffect(() => {
    if (value && !isProcessing && themePart === "" && problemPart === "" && objectivesPart === "") {
      extractPartsFromIntroduction();
    }
  }, []);

  // Função para combinar as partes em um texto único
  const combinePartsIntoIntroduction = () => {
    try {
      setIsProcessing(true);
      let combinedText = "";
      
      if (themePart) {
        combinedText += themePart + "\n\n";
      }
      
      if (problemPart) {
        combinedText += problemPart + "\n\n";
      }
      
      if (objectivesPart) {
        combinedText += objectivesPart;
      }
      
      onChange(combinedText.trim());
      toast({
        title: "Introdução combinada",
        description: "As partes foram unidas em um texto único",
      });
      setActiveTab("editor");
    } catch (error) {
      console.error("Erro ao combinar partes:", error);
      toast({
        title: "Erro ao combinar",
        description: "Ocorreu um erro ao combinar as partes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para extrair partes do texto completo
  const extractPartsFromIntroduction = () => {
    try {
      setIsProcessing(true);
      // Tentativa simples de dividir o texto em 3 partes
      const paragraphs = value.split(/\n\s*\n/);
      
      if (paragraphs.length >= 3) {
        setThemePart(paragraphs[0]);
        setProblemPart(paragraphs[1]);
        setObjectivesPart(paragraphs.slice(2).join("\n\n"));
      } else if (paragraphs.length === 2) {
        setThemePart(paragraphs[0]);
        setProblemPart(paragraphs[1]);
        setObjectivesPart("");
      } else if (paragraphs.length === 1 && paragraphs[0]) {
        setThemePart(paragraphs[0]);
        setProblemPart("");
        setObjectivesPart("");
      } else {
        setThemePart("");
        setProblemPart("");
        setObjectivesPart("");
      }
      
      toast({
        title: "Introdução dividida",
        description: "O texto foi dividido em partes para edição",
      });
    } catch (error) {
      console.error("Erro ao extrair partes:", error);
      toast({
        title: "Erro ao dividir",
        description: "Ocorreu um erro ao dividir o texto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Introdução</CardTitle>
        <CardDescription>
          Uma boa introdução contextualiza o tema, apresenta o problema e estabelece os objetivos do trabalho.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="guided">Editor Guiado</TabsTrigger>
              <TabsTrigger value="editor">Editor Completo</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              {activeTab === "editor" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={extractPartsFromIntroduction}
                  disabled={!value || isProcessing}
                >
                  Dividir em Partes
                </Button>
              )}
              
              {activeTab === "guided" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={combinePartsIntoIntroduction}
                  disabled={isProcessing}
                >
                  Combinar Partes
                </Button>
              )}
            </div>
          </div>
          
          <TabsContent value="guided" className="mt-0">
            <Accordion type="multiple" defaultValue={["theme", "problem", "objectives"]} className="w-full space-y-4">
              <AccordionItem value="theme" className="border rounded-lg p-2">
                <AccordionTrigger className="py-2 px-4 hover:bg-muted/50 rounded-md">
                  Apresentação do Tema
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    <p>Explique o tema da pesquisa, fornecendo informações atualizadas da literatura e estatísticas relevantes. Este parágrafo deve situar o leitor no contexto geral do assunto.</p>
                  </div>
                  <RichTextEditor
                    value={themePart}
                    onChange={setThemePart}
                    maxLines={20}
                    minLines={5}
                    sectionName="tema"
                    placeholder="Apresente o tema em linhas gerais, contextualizando o campo de estudo..."
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="problem" className="border rounded-lg p-2">
                <AccordionTrigger className="py-2 px-4 hover:bg-muted/50 rounded-md">
                  Delimitação do Problema (Problematização)
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    <p>Mostre a lacuna existente no conhecimento atual sobre o tema e esclareça qual questão específica o estudo busca responder. Este parágrafo deve afunilar o conhecimento para o problema específico que será estudado.</p>
                  </div>
                  <RichTextEditor
                    value={problemPart}
                    onChange={setProblemPart}
                    maxLines={20}
                    minLines={5}
                    sectionName="problema"
                    placeholder="Identifique a lacuna no conhecimento e a questão específica a ser estudada..."
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="objectives" className="border rounded-lg p-2">
                <AccordionTrigger className="py-2 px-4 hover:bg-muted/50 rounded-md">
                  Objetivos e Justificativas
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    <p>Apresente claramente os objetivos do trabalho, indicando como a pesquisa pretende preencher a lacuna identificada. Explique a relevância e a importância do estudo, destacando por que ele é necessário e o que ele pode contribuir para a área de conhecimento.</p>
                  </div>
                  <RichTextEditor
                    value={objectivesPart}
                    onChange={setObjectivesPart}
                    maxLines={20}
                    minLines={5}
                    sectionName="objetivos"
                    placeholder="Defina os objetivos gerais e específicos e justifique a importância do estudo..."
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="editor" className="mt-0">
            <RichTextEditor
              value={value}
              onChange={onChange}
              maxLines={maxLines}
              minLines={minLines}
              sectionName="introdução"
              placeholder="Digite a introdução completa, contextualizando o tema, problema de pesquisa e objetivos..."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IntroductionEditor;
