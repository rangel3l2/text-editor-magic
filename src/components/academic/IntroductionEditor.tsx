
import { useState, useEffect, useRef } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ValidationFeedback from "@/components/editor/ValidationFeedback";
import { useEditorValidation } from "@/components/editor/useEditorValidation";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IntroductionEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLines?: number;
  minLines?: number;
}

const IntroductionEditor = ({
  value,
  onChange,
  maxLines = 100,
  minLines = 10,
}: IntroductionEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>("guided");
  const [themePart, setThemePart] = useState<string>("");
  const [problemPart, setProblemPart] = useState<string>("");
  const [objectivesPart, setObjectivesPart] = useState<string>("");
  const [irrelevantPart, setIrrelevantPart] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAllPartsCompleted, setIsAllPartsCompleted] = useState(false);
  const lastSegmentedValue = useRef<string>("");
  const { toast } = useToast();
  
  const {
    validationResult,
    isValidating,
    errorMessage,
    validateContent,
    scheduleValidation,
    currentSection
  } = useEditorValidation("introdução completa");
  
  const {
    validationResult: themeValidationResult,
    isValidating: isThemeValidating,
    errorMessage: themeErrorMessage,
    validateContent: validateTheme,
    currentSection: themeCurrentSection
  } = useEditorValidation("tema");
  
  const {
    validationResult: problemValidationResult,
    isValidating: isProblemValidating,
    errorMessage: problemErrorMessage,
    validateContent: validateProblem,
    currentSection: problemCurrentSection
  } = useEditorValidation("problema");
  
  const {
    validationResult: objectivesValidationResult,
    isValidating: isObjectivesValidating,
    errorMessage: objectivesErrorMessage,
    validateContent: validateObjectives,
    currentSection: objectivesCurrentSection
  } = useEditorValidation("objetivos");

  useEffect(() => {
    const themeCompleted = themePart.trim().length > 50;
    const problemCompleted = problemPart.trim().length > 50;
    const objectivesCompleted = objectivesPart.trim().length > 50;
    setIsAllPartsCompleted(themeCompleted && problemCompleted && objectivesCompleted);
  }, [themePart, problemPart, objectivesPart]);

  // Auto-segment when value changes externally and parts are empty
  useEffect(() => {
    if (value && !isProcessing && themePart === "" && problemPart === "" && objectivesPart === "") {
      extractPartsFromIntroduction(value);
    }
  }, [value]);

  // Auto-segment when switching to guided tab if content changed
  const handleTabChange = (newTab: string) => {
    if (newTab === "guided" && value && value.trim().length > 50) {
      const plainValue = value.replace(/<[^>]*>/g, '').trim();
      const lastPlain = lastSegmentedValue.current.replace(/<[^>]*>/g, '').trim();
      
      // Only re-segment if content changed significantly since last segmentation
      if (plainValue !== lastPlain && plainValue.length > 50) {
        extractPartsFromIntroduction(value);
      }
    }
    setActiveTab(newTab);
  };

  useEffect(() => {
    if (isAllPartsCompleted && activeTab === "guided") {
      const combinedText = getCombinedText();
      scheduleValidation(combinedText);
    }
  }, [isAllPartsCompleted, activeTab, themePart, problemPart, objectivesPart]);

  const getCombinedText = (): string => {
    let combinedText = "";
    if (themePart) combinedText += themePart + "\n\n";
    if (problemPart) combinedText += problemPart + "\n\n";
    if (objectivesPart) combinedText += objectivesPart;
    return combinedText.trim();
  };

  const combinePartsIntoIntroduction = () => {
    try {
      setIsProcessing(true);
      const combinedText = getCombinedText();
      onChange(combinedText);
      toast({
        title: "Introdução combinada",
        description: "As partes foram unidas em um texto único estruturado com parágrafos",
      });
      setActiveTab("editor");
      validateContent(combinedText);
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

  const extractPartsFromIntroduction = async (textToSegment?: string) => {
    const text = textToSegment || value;
    if (!text || text.replace(/<[^>]*>/g, '').trim().length < 30) return;
    
    try {
      setIsProcessing(true);
      
      toast({
        title: "Segmentando introdução",
        description: "A IA está analisando e dividindo sua introdução em partes...",
      });

      const { data, error } = await supabase.functions.invoke("segment-introduction", {
        body: { introduction: text }
      });

      if (error) {
        console.error("Erro ao segmentar introdução:", error);
        throw error;
      }

      if (data) {
        setThemePart(data.theme || "");
        setProblemPart(data.problem || "");
        setObjectivesPart(data.objectives || "");
        setIrrelevantPart(data.irrelevant || "");
        lastSegmentedValue.current = text;
        
        const hasIrrelevant = (data.irrelevant || "").trim().length > 0;
        
        toast({
          title: hasIrrelevant ? "Introdução segmentada (com alertas)" : "Introdução segmentada",
          description: hasIrrelevant 
            ? "Alguns trechos do texto não parecem pertencer à introdução. Veja os alertas."
            : "O texto foi dividido inteligentemente em tema, problema e objetivos",
          variant: hasIrrelevant ? "destructive" : "default",
        });
        
        setActiveTab("guided");
      }
    } catch (error) {
      console.error("Erro ao extrair partes:", error);
      toast({
        title: "Erro ao segmentar",
        description: "Não foi possível segmentar automaticamente. Tente dividir manualmente.",
        variant: "destructive",
      });
      
      const plainText = text.replace(/<[^>]*>/g, '');
      const paragraphs = plainText.split(/\n\s*\n/).filter(p => p.trim());
      
      if (paragraphs.length >= 3) {
        setThemePart(paragraphs[0]);
        setProblemPart(paragraphs[1]);
        setObjectivesPart(paragraphs.slice(2).join("\n\n"));
      } else if (paragraphs.length === 2) {
        setThemePart(paragraphs[0]);
        setProblemPart(paragraphs[1]);
      } else if (paragraphs.length === 1 && paragraphs[0]) {
        setThemePart(paragraphs[0]);
      }
      lastSegmentedValue.current = text;
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "guided" && !isProcessing) {
      const combinedText = getCombinedText();
      onChange(combinedText);
    }
  }, [themePart, problemPart, objectivesPart, activeTab]);

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Introdução</CardTitle>
        <CardDescription>
          Uma boa introdução contextualiza o tema, apresenta o problema e estabelece os objetivos do trabalho.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                  onClick={() => extractPartsFromIntroduction()}
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
          
          {/* Alerta de conteúdo irrelevante */}
          {irrelevantPart.trim().length > 0 && activeTab === "guided" && (
            <Alert variant="destructive" className="mb-4 border-2 border-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                <p className="font-bold mb-2">⚠️ Conteúdo que não pertence à Introdução</p>
                <p className="text-sm mb-3">
                  Segundo a <strong>Teoria do Andaime</strong>, cada seção do artigo tem uma função específica. 
                  O trecho abaixo <strong>não se encaixa em nenhuma parte da introdução</strong>. 
                  Reflita: em qual outra seção do seu artigo (Metodologia, Resultados, Conclusão, Referencial Teórico...) 
                  este conteúdo se encaixaria melhor?
                </p>
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm" 
                     style={{ color: 'hsl(var(--destructive))' }}>
                  <p className="whitespace-pre-wrap font-medium">{irrelevantPart}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIrrelevantPart("")}
                >
                  Entendi, remover este alerta
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {isAllPartsCompleted && activeTab === "guided" && (
            <div className="mb-4">
              <ValidationFeedback 
                validationResult={validationResult} 
                isValidating={isValidating} 
                errorMessage={errorMessage} 
                currentSection={currentSection}
              />
            </div>
          )}
          
          <TabsContent value="guided" className="mt-0">
            {isProcessing && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                <span>Analisando e segmentando sua introdução com IA...</span>
              </div>
            )}
            
            {!isProcessing && (
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
                      showValidationFeedback={false}
                    />
                    
                    {themePart.trim().length > 50 && !isThemeValidating && !themeValidationResult?.feedbacks?.length && (
                      <Button
                        onClick={() => validateTheme(themePart)}
                        variant="default"
                        size="lg"
                        className="w-full gap-2 py-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-pulse mt-3"
                      >
                        <div className="relative flex items-center gap-2 pointer-events-none">
                          <Sparkles className="h-5 w-5 text-primary-foreground" />
                          <span className="font-bold text-sm sm:text-base">
                            ✨ Clique aqui para orientação sobre o Tema
                          </span>
                        </div>
                      </Button>
                    )}
                    
                    {themePart.trim().length > 50 && (
                      <div className="mt-4">
                        <ValidationFeedback 
                          validationResult={themeValidationResult} 
                          isValidating={isThemeValidating} 
                          errorMessage={themeErrorMessage} 
                          currentSection={themeCurrentSection || "Tema"}
                          onRetry={() => validateTheme(themePart)}
                          onRevalidate={() => validateTheme(themePart)}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="problem" className="border rounded-lg p-2">
                  <AccordionTrigger className="py-2 px-4 hover:bg-muted/50 rounded-md">
                    Delimitação do Problema (Problematização)
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="mb-2 text-sm text-muted-foreground">
                      <p>Mostre a lacuna existente no conhecimento atual sobre o tema e esclareça qual questão específica o estudo busca responder.</p>
                    </div>
                    <RichTextEditor
                      value={problemPart}
                      onChange={setProblemPart}
                      maxLines={20}
                      minLines={5}
                      sectionName="problema"
                      placeholder="Identifique a lacuna no conhecimento e a questão específica a ser estudada..."
                      showValidationFeedback={false}
                    />
                    
                    {problemPart.trim().length > 50 && !isProblemValidating && !problemValidationResult?.feedbacks?.length && (
                      <Button
                        onClick={() => validateProblem(problemPart)}
                        variant="default"
                        size="lg"
                        className="w-full gap-2 py-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-pulse mt-3"
                      >
                        <div className="relative flex items-center gap-2 pointer-events-none">
                          <Sparkles className="h-5 w-5 text-primary-foreground" />
                          <span className="font-bold text-sm sm:text-base">
                            ✨ Clique aqui para orientação sobre o Problema
                          </span>
                        </div>
                      </Button>
                    )}
                    
                    {problemPart.trim().length > 50 && (
                      <div className="mt-4">
                        <ValidationFeedback 
                          validationResult={problemValidationResult} 
                          isValidating={isProblemValidating} 
                          errorMessage={problemErrorMessage} 
                          currentSection={problemCurrentSection || "Problema"}
                          onRetry={() => validateProblem(problemPart)}
                          onRevalidate={() => validateProblem(problemPart)}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="objectives" className="border rounded-lg p-2">
                  <AccordionTrigger className="py-2 px-4 hover:bg-muted/50 rounded-md">
                    Objetivos e Justificativas
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="mb-2 text-sm text-muted-foreground">
                      <p>Apresente claramente os objetivos do trabalho e explique a relevância e a importância do estudo.</p>
                    </div>
                    <RichTextEditor
                      value={objectivesPart}
                      onChange={setObjectivesPart}
                      maxLines={20}
                      minLines={5}
                      sectionName="objetivos"
                      placeholder="Defina os objetivos gerais e específicos e justifique a importância do estudo..."
                      showValidationFeedback={false}
                    />
                    
                    {objectivesPart.trim().length > 50 && !isObjectivesValidating && !objectivesValidationResult?.feedbacks?.length && (
                      <Button
                        onClick={() => validateObjectives(objectivesPart)}
                        variant="default"
                        size="lg"
                        className="w-full gap-2 py-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-pulse mt-3"
                      >
                        <div className="relative flex items-center gap-2 pointer-events-none">
                          <Sparkles className="h-5 w-5 text-primary-foreground" />
                          <span className="font-bold text-sm sm:text-base">
                            ✨ Clique aqui para orientação sobre os Objetivos
                          </span>
                        </div>
                      </Button>
                    )}
                    
                    {objectivesPart.trim().length > 50 && (
                      <div className="mt-4">
                        <ValidationFeedback 
                          validationResult={objectivesValidationResult} 
                          isValidating={isObjectivesValidating} 
                          errorMessage={objectivesErrorMessage} 
                          currentSection={objectivesCurrentSection || "Objetivos"}
                          onRetry={() => validateObjectives(objectivesPart)}
                          onRevalidate={() => validateObjectives(objectivesPart)}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
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
