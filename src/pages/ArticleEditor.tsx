import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ArticleEditor = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor de Artigo Científico</CardTitle>
          <CardDescription>
            Desenvolva seu artigo científico seguindo as normas acadêmicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Editor de artigo científico em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleEditor;