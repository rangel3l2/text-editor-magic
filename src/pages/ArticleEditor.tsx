
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ArticleEditor = () => {
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
          <p className="text-muted-foreground">
            Editor de artigo científico em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ArticleEditor;
