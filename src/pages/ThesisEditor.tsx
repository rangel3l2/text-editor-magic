
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ThesisEditor = () => {
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
          <p className="text-muted-foreground">
            Editor de tese/dissertação em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ThesisEditor;
