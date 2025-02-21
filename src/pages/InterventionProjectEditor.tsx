
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const InterventionProjectEditor = () => {
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
          <p className="text-muted-foreground">
            Editor de projeto de intervenção em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default InterventionProjectEditor;
