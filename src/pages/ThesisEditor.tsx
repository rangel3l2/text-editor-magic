import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ThesisEditor = () => {
  return (
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
  );
};

export default ThesisEditor;