import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText, FileText, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const WorkInProgress = () => {
  const { user, signInWithGoogle } = useAuth();

  if (!user) {
    return (
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Meus Trabalhos</h2>
        <Card className="shadow-lg text-center p-8">
          <div className="flex flex-col items-center gap-4">
            <LogIn className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              Você precisa fazer login para seus trabalhos aparecerem
            </p>
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              className="mt-2"
            >
              Entrar com Google
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-center mb-8">Meus Trabalhos</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookText className="h-5 w-5" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum trabalho em andamento</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum trabalho concluído</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkInProgress;