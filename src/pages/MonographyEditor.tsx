
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MonographyEditor = () => {
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
          <p className="text-muted-foreground">
            Editor de monografia em desenvolvimento...
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default MonographyEditor;
