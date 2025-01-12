import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText, FileText, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

const WorkInProgress = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: workTypes } = useQuery({
    queryKey: ['academicWorkTypes'],
    queryFn: async () => {
      console.log('Fetching work types...');
      const { data, error } = await supabase
        .from('academic_work_types')
        .select('*');
      if (error) throw error;
      console.log('Work types fetched:', data);
      return data;
    },
  });

  const { data: works, isLoading } = useQuery({
    queryKey: ['works', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        // Fetch works from database
        const { data: dbWorks, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('last_modified', { ascending: false });
          
        if (error) {
          console.error('Error fetching works:', error);
          toast({
            title: "Erro ao carregar trabalhos",
            description: "Não foi possível carregar seus trabalhos do banco de dados.",
            variant: "destructive",
          });
          return [];
        }

        // Get works from localStorage
        const localWorks = Object.entries(localStorage)
          .filter(([key]) => key.startsWith(`banner_work_${user.id}`))
          .map(([key, value]) => {
            try {
              const localWork = JSON.parse(value);
              const workId = key.split('_').pop();
              const randomId = Math.floor(Math.random() * 10000);
              return {
                id: workId,
                title: localWork.title || `Trabalho Desconhecido #${randomId}`,
                work_type: 'banner',
                content: localWork.content,
                last_modified: localWork.lastModified || new Date().toISOString(),
                isLocal: true
              };
            } catch (e) {
              console.error('Error parsing local work:', e);
              return null;
            }
          })
          .filter(Boolean);

        // Combine and sort works
        const allWorks = [...(dbWorks || []), ...localWorks]
          .map(work => ({
            ...work,
            title: work.title || `Trabalho Desconhecido #${work.id.slice(0, 8)}`
          }))
          .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());

        console.log('All works loaded:', allWorks);
        return allWorks;
      } catch (error) {
        console.error('Error in queryFn:', error);
        toast({
          title: "Erro ao carregar trabalhos",
          description: "Ocorreu um erro ao carregar seus trabalhos.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
    initialData: [],
  });

  const getWorkTypeName = (workType: string) => {
    const type = workTypes?.find(t => t.name.toLowerCase().replace(/\s+/g, '') === workType.toLowerCase());
    return type?.name || workType;
  };

  const handleWorkClick = (work: any) => {
    if (!work) return;
    
    console.log('Navigating to work:', work);
    const route = `/${work.work_type.toLowerCase()}/${work.id}`;
    console.log('Route:', route);
    navigate(route);
  };

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
                    onClick={() => handleWorkClick(work)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {work.title}
                          {work.isLocal && <span className="ml-2 text-sm text-muted-foreground">(Local)</span>}
                        </p>
                        <Badge variant="outline" className="ml-2">
                          {getWorkTypeName(work.work_type)}
                        </Badge>
                      </div>
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
                    onClick={() => handleWorkClick(work)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{work.title}</p>
                        <Badge variant="outline" className="ml-2">
                          {getWorkTypeName(work.work_type)}
                        </Badge>
                      </div>
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