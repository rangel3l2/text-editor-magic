
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cleanHtmlTags } from "@/utils/latexProcessor";

const ThesisEditor = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Editor de Tese/Dissertação</CardTitle>
            <CardDescription>
              Estruture sua tese ou dissertação de forma profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Editor de tese/dissertação em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ThesisEditor;
