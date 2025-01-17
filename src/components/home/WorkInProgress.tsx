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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: works, isLoading } = useQuery({
    queryKey: ['works', user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];
        
        console.log('Fetching works for user:', user.id);
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

        console.log('DB works fetched:', dbWorks);

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
                created_at: localWork.created_at || new Date().toISOString(),
                isLocal: true
              };
            } catch (e) {
              console.error('Error parsing local work:', e);
              return null;
            }
          })
          .filter(Boolean);

        console.log('Local works found:', localWorks);

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
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const getWorkTypeName = (workType: string) => {
    const type = workTypes?.find(t => t.name.toLowerCase().replace(/\s+/g, '') === workType.toLowerCase());
    return type?.name || workType;
  };

  const getWorkTypeRoute = (workType: string): string => {
    const workTypeRoutes: { [key: string]: string } = {
      'banner': 'banner',
      'article': 'article',
      'thesis': 'thesis',
      'monography': 'monography',
      'intervention': 'intervention'
    };

    const route = workTypeRoutes[workType.toLowerCase()];
    if (!route) {
      console.error('Unknown work type:', workType);
      return 'banner';
    }
    return route;
  };

  const handleWorkClick = (work: any) => {
    if (!work) return;
    
    console.log('Navigating to work:', work);
    const route = getWorkTypeRoute(work.work_type);
    const fullRoute = `/${route}/${work.id}`;
    console.log('Route:', fullRoute);
    navigate(fullRoute);
  };

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

  // Filter works based on completion status
  const inProgressWorks = works?.filter(work => !work.content?.isComplete) || [];
  const completedWorks = works?.filter(work => work.content?.isComplete) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                    className="flex flex-col p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleWorkClick(work)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {work.title}
                          {work.isLocal && <span className="ml-2 text-sm text-muted-foreground">(Local)</span>}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {getWorkTypeName(work.work_type)}
                          </Badge>
                          <p>ID: {work.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Criado em: {formatDate(work.created_at)}</p>
                      <p>Última modificação: {formatDate(work.last_modified)}</p>
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
                    className="flex flex-col p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleWorkClick(work)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{work.title}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {getWorkTypeName(work.work_type)}
                          </Badge>
                          <p>ID: {work.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Criado em: {formatDate(work.created_at)}</p>
                      <p>Última modificação: {formatDate(work.last_modified)}</p>
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