
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor";
import { useState } from "react";

const MonographyEditor = () => {
  const [content, setContent] = useState({
    coverPage: "",
    abstract: "",
    introduction: "",
    theoreticalFramework: "",
    methodology: "",
    results: "",
    discussion: "",
    conclusion: "",
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
          <CardTitle>Editor de Monografia</CardTitle>
          <CardDescription>
            Estruture sua monografia de forma profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="coverPage" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
              <TabsTrigger value="coverPage">Capa</TabsTrigger>
              <TabsTrigger value="abstract">Resumo</TabsTrigger>
              <TabsTrigger value="introduction">Introdução</TabsTrigger>
              <TabsTrigger value="theoreticalFramework">Referencial</TabsTrigger>
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="discussion">Discussão</TabsTrigger>
              <TabsTrigger value="conclusion">Conclusão</TabsTrigger>
              <TabsTrigger value="references">Referências</TabsTrigger>
            </TabsList>

            <TabsContent value="coverPage">
              <Card>
                <CardHeader>
                  <CardTitle>Capa</CardTitle>
                  <CardDescription>
                    Informações da capa da monografia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.coverPage}
                    onChange={handleContentChange("coverPage")}
                    maxLines={20}
                    minLines={10}
                    placeholder="Digite as informações da capa..."
                    sectionName="coverPage"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="abstract">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>
                    Escreva um resumo da sua monografia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.abstract}
                    onChange={handleContentChange("abstract")}
                    maxLines={20}
                    minLines={10}
                    placeholder="Digite o resumo..."
                    sectionName="abstract"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="introduction">
              <Card>
                <CardHeader>
                  <CardTitle>Introdução</CardTitle>
                  <CardDescription>
                    Apresente o tema e objetivos do seu trabalho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.introduction}
                    onChange={handleContentChange("introduction")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite a introdução..."
                    sectionName="introduction"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theoreticalFramework">
              <Card>
                <CardHeader>
                  <CardTitle>Referencial Teórico</CardTitle>
                  <CardDescription>
                    Apresente as teorias e conceitos base do seu trabalho
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
                    Descreva os métodos utilizados na pesquisa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.methodology}
                    onChange={handleContentChange("methodology")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite a metodologia..."
                    sectionName="methodology"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Resultados</CardTitle>
                  <CardDescription>
                    Apresente os resultados da sua pesquisa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.results}
                    onChange={handleContentChange("results")}
                    maxLines={100}
                    minLines={30}
                    placeholder="Digite os resultados..."
                    sectionName="results"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion">
              <Card>
                <CardHeader>
                  <CardTitle>Discussão</CardTitle>
                  <CardDescription>
                    Discuta os resultados encontrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.discussion}
                    onChange={handleContentChange("discussion")}
                    maxLines={100}
                    minLines={30}
                    placeholder="Digite a discussão..."
                    sectionName="discussion"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conclusion">
              <Card>
                <CardHeader>
                  <CardTitle>Conclusão</CardTitle>
                  <CardDescription>
                    Apresente as conclusões do seu trabalho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.conclusion}
                    onChange={handleContentChange("conclusion")}
                    maxLines={30}
                    minLines={15}
                    placeholder="Digite a conclusão..."
                    sectionName="conclusion"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="references">
              <Card>
                <CardHeader>
                  <CardTitle>Referências</CardTitle>
                  <CardDescription>
                    Liste as referências utilizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.references}
                    onChange={handleContentChange("references")}
                    maxLines={100}
                    minLines={10}
                    placeholder="Digite as referências..."
                    sectionName="references"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default MonographyEditor;
