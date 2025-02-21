
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor";
import { useState } from "react";

const ArticleEditor = () => {
  const [content, setContent] = useState({
    title: "",
    abstract: "",
    introduction: "",
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
          <CardTitle>Editor de Artigo Científico</CardTitle>
          <CardDescription>
            Estruture seu artigo científico de forma profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="title" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="title">Título</TabsTrigger>
              <TabsTrigger value="abstract">Resumo</TabsTrigger>
              <TabsTrigger value="introduction">Introdução</TabsTrigger>
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="discussion">Discussão</TabsTrigger>
              <TabsTrigger value="conclusion">Conclusão</TabsTrigger>
              <TabsTrigger value="references">Referências</TabsTrigger>
            </TabsList>

            <TabsContent value="title">
              <Card>
                <CardHeader>
                  <CardTitle>Título do Artigo</CardTitle>
                  <CardDescription>
                    Digite o título do seu artigo científico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.title}
                    onChange={handleContentChange("title")}
                    maxLines={2}
                    minLines={1}
                    placeholder="Digite o título do seu artigo..."
                    sectionName="title"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="abstract">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>
                    Escreva um breve resumo do seu artigo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.abstract}
                    onChange={handleContentChange("abstract")}
                    maxLines={15}
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
                    Apresente o contexto e objetivos do seu estudo
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
                    maxLines={50}
                    minLines={20}
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
                    maxLines={50}
                    minLines={20}
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
                    Apresente as conclusões do seu estudo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={content.conclusion}
                    onChange={handleContentChange("conclusion")}
                    maxLines={30}
                    minLines={10}
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

export default ArticleEditor;
