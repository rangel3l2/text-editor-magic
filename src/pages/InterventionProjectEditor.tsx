
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor";
import { useState } from "react";

const InterventionProjectEditor = () => {
  const [content, setContent] = useState({
    context: "",
    problemDefinition: "",
    objectives: "",
    justification: "",
    theoreticalFramework: "",
    methodology: "",
    timeline: "",
    budget: "",
    expectedResults: "",
    references: ""
  });

  const handleContentChange = (section: string) => (newContent: string) => {
    setContent(prev => ({
      ...prev,
      [section]: newContent
    }));
  };

  return (
    <MainLayout showWorks={false}>
      <Card>
        <CardHeader>
          <CardTitle>Editor de Projeto de Intervenção</CardTitle>
          <CardDescription>
            Estruture seu projeto de intervenção de forma profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="context" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-10">
              <TabsTrigger value="context">Contexto</TabsTrigger>
              <TabsTrigger value="problemDefinition">Problema</TabsTrigger>
              <TabsTrigger value="objectives">Objetivos</TabsTrigger>
              <TabsTrigger value="justification">Justificativa</TabsTrigger>
              <TabsTrigger value="theoreticalFramework">Referencial</TabsTrigger>
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
              <TabsTrigger value="timeline">Cronograma</TabsTrigger>
              <TabsTrigger value="budget">Orçamento</TabsTrigger>
              <TabsTrigger value="expectedResults">Resultados Esperados</TabsTrigger>
              <TabsTrigger value="references">Referências</TabsTrigger>
            </TabsList>

            <TabsContent value="context">
              <Card>
                <CardHeader>
                  <CardTitle>Contexto</CardTitle>
                  <CardDescription>
                    Descreva o contexto onde a intervenção será realizada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.context}
                    onChange={handleContentChange("context")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite o contexto..."
                    sectionName="context"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="problemDefinition">
              <Card>
                <CardHeader>
                  <CardTitle>Definição do Problema</CardTitle>
                  <CardDescription>
                    Identifique e descreva o problema a ser abordado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.problemDefinition}
                    onChange={handleContentChange("problemDefinition")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite a definição do problema..."
                    sectionName="problemDefinition"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives">
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos</CardTitle>
                  <CardDescription>
                    Defina os objetivos gerais e específicos da intervenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.objectives}
                    onChange={handleContentChange("objectives")}
                    maxLines={30}
                    minLines={15}
                    placeholder="Digite os objetivos..."
                    sectionName="objectives"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="justification">
              <Card>
                <CardHeader>
                  <CardTitle>Justificativa</CardTitle>
                  <CardDescription>
                    Explique a importância e relevância da intervenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.justification}
                    onChange={handleContentChange("justification")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite a justificativa..."
                    sectionName="justification"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theoreticalFramework">
              <Card>
                <CardHeader>
                  <CardTitle>Referencial Teórico</CardTitle>
                  <CardDescription>
                    Base teórica que fundamenta a intervenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.theoreticalFramework}
                    onChange={handleContentChange("theoreticalFramework")}
                    maxLines={100}
                    minLines={50}
                    placeholder="Digite o referencial teórico..."
                    sectionName="theoreticalFramework"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methodology">
              <Card>
                <CardHeader>
                  <CardTitle>Metodologia</CardTitle>
                  <CardDescription>
                    Descreva como a intervenção será implementada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.methodology}
                    onChange={handleContentChange("methodology")}
                    maxLines={100}
                    minLines={50}
                    placeholder="Digite a metodologia..."
                    sectionName="methodology"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Cronograma</CardTitle>
                  <CardDescription>
                    Planejamento temporal das atividades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.timeline}
                    onChange={handleContentChange("timeline")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite o cronograma..."
                    sectionName="timeline"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget">
              <Card>
                <CardHeader>
                  <CardTitle>Orçamento</CardTitle>
                  <CardDescription>
                    Recursos necessários e custos estimados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.budget}
                    onChange={handleContentChange("budget")}
                    maxLines={50}
                    minLines={20}
                