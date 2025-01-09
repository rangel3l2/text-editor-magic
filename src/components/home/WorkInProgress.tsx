import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText, FileText, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const WorkInProgress = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const { data: works, isLoading } = useQuery({
    queryKey: ['works', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('work_in_progress')
        .select('*')
        .order('last_modified', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const inProgressWorks = works?.filter(work => !work.content?.isComplete) || [];
  const completedWorks = works?.filter(work => work.content?.isComplete) || [];

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
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : inProgressWorks.length > 0 ? (
              <div className="space-y-4">
                {inProgressWorks.map((work) => (
                  <div
                    key={work.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/${work.work_type.toLowerCase()}/${work.id}`)}
                  >
                    <div>
                      <p className="font-medium">{work.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Última modificação: {new Date(work.last_modified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum trabalho em andamento</p>
            )}
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
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : completedWorks.length > 0 ? (
              <div className="space-y-4">
                {completedWorks.map((work) => (
                  <div
                    key={work.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/${work.work_type.toLowerCase()}/${work.id}`)}
                  >
                    <div>
                      <p className="font-medium">{work.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Concluído em: {new Date(work.last_modified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum trabalho concluído</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkInProgress;