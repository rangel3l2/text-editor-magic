
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor";
import { useState } from "react";

const ThesisEditor = () => {
  const [content, setContent] = useState({
    preliminaryPages: "",
    abstract: "",
    introduction: "",
    literatureReview: "",
    methodology: "",
    results: "",
    discussion: "",
    conclusion: "",
    references: "",
    appendix: ""
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
          <CardTitle>Editor de Tese/Dissertação</CardTitle>
          <CardDescription>
            Estruture sua tese ou dissertação de forma profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preliminaryPages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-10">
              <TabsTrigger value="preliminaryPages">Páginas Preliminares</TabsTrigger>
              <TabsTrigger value="abstract">Resumo</TabsTrigger>
              <TabsTrigger value="introduction">Introdução</TabsTrigger>
              <TabsTrigger value="literatureReview">Revisão de Literatura</TabsTrigger>
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="discussion">Discussão</TabsTrigger>
              <TabsTrigger value="conclusion">Conclusão</TabsTrigger>
              <TabsTrigger value="references">Referências</TabsTrigger>
              <TabsTrigger value="appendix">Apêndices</TabsTrigger>
            </TabsList>

            <TabsContent value="preliminaryPages">
              <Card>
                <CardHeader>
                  <CardTitle>Páginas Preliminares</CardTitle>
                  <CardDescription>
                    Capa, folha de rosto, dedicatória, agradecimentos, etc.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.preliminaryPages}
                    onChange={handleContentChange("preliminaryPages")}
                    maxLines={50}
                    minLines={20}
                    placeholder="Digite as páginas preliminares..."
                    sectionName="preliminaryPages"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="abstract">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>
                    Resumo da tese/dissertação em português e inglês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.abstract}
                    onChange={handleContentChange("abstract")}
                    maxLines={30}
                    minLines={15}
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
                    Contextualização, problema de pesquisa, objetivos e justificativa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.introduction}
                    onChange={handleContentChange("introduction")}
                    maxLines={100}
                    minLines={50}
                    placeholder="Digite a introdução..."
                    sectionName="introduction"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="literatureReview">
              <Card>
                <CardHeader>
                  <CardTitle>Revisão de Literatura</CardTitle>
                  <CardDescription>
                    Fundamentação teórica e estado da arte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.literatureReview}
                    onChange={handleContentChange("literatureReview")}
                    maxLines={200}
                    minLines={100}
                    placeholder="Digite a revisão de literatura..."
                    sectionName="literatureReview"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methodology">
              <Card>
                <CardHeader>
                  <CardTitle>Metodologia</CardTitle>
                  <CardDescription>
                    Método, procedimentos e instrumentos de pesquisa
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

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Resultados</CardTitle>
                  <CardDescription>
                    Apresentação dos resultados da pesquisa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.results}
                    onChange={handleContentChange("results")}
                    maxLines={200}
                    minLines={100}
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
                    Interpretação e discussão dos resultados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.discussion}
                    onChange={handleContentChange("discussion")}
                    maxLines={200}
                    minLines={100}
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
                    Conclusões, contribuições e sugestões para trabalhos futuros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.conclusion}
                    onChange={handleContentChange("conclusion")}
                    maxLines={50}
                    minLines={25}
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
                    Lista de referências bibliográficas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.references}
                    onChange={handleContentChange("references")}
                    maxLines={200}
                    minLines={50}
                    placeholder="Digite as referências..."
                    sectionName="references"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appendix">
              <Card>
                <CardHeader>
                  <CardTitle>Apêndices</CardTitle>
                  <CardDescription>
                    Materiais complementares e documentos adicionais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.appendix}
                    onChange={handleContentChange("appendix")}
                    maxLines={200}
                    minLines={20}
                    placeholder="Digite os apêndices..."
                    sectionName="appendix"
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

export default ThesisEditor;
