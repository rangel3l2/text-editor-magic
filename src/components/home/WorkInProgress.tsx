import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText, FileText, LogIn, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useIsAdmin } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const WorkInProgress = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAllWorks, setShowAllWorks] = useState(false);
  const [deleteWorkId, setDeleteWorkId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin(user);

  const { data: workTypes } = useQuery({
    queryKey: ['academicWorkTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_work_types')
        .select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: works = [], isLoading } = useQuery({
    queryKey: ['works-basic', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('work_in_progress')
        .select('id, title, work_type, created_at, last_modified, user_id');
      
      // If admin, get all works limited to 10, otherwise get only user's works
      if (isAdmin) {
        query = query.order('last_modified', { ascending: false }).limit(10);
      } else {
        query = query.eq('user_id', user.id).order('last_modified', { ascending: false });
      }
        
      const { data: dbWorks, error } = await query;
        
      if (error) {
        console.error('Error fetching works:', error);
        toast({
          title: "Erro ao carregar trabalhos",
          description: "Não foi possível carregar seus trabalhos do banco de dados.",
          variant: "destructive",
        });
        return [];
      }

      if (!dbWorks || dbWorks.length === 0) return [];

      // If admin, fetch user emails for listed works and map them
      let emailMap: Record<string, string> = {};
      if (isAdmin) {
        const userIds = Array.from(new Set(dbWorks.map((w: any) => w.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds as string[]);
          if (!profilesError && profiles) {
            emailMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.email]));
          }
        }
      }

      // Map works and add isComplete as false
      return (dbWorks || []).map((work: any) => ({ 
        ...work, 
        isComplete: false,
        userEmail: isAdmin ? emailMap[work.user_id] : undefined
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60,
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
      'intervention': 'intervention-project'
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
    navigate(`/${route}/${work.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteWork = async () => {
    if (!deleteWorkId || !user) return;
    
    try {
      const { error } = await supabase
        .from('work_in_progress')
        .delete()
        .eq('id', deleteWorkId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Atualiza a cache do React Query
      queryClient.invalidateQueries({ queryKey: ['works-basic'] });
      
      toast({
        title: "Trabalho excluído",
        description: "O trabalho foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting work:', error);
      toast({
        title: "Erro ao excluir trabalho",
        description: "Não foi possível excluir o trabalho.",
        variant: "destructive",
      });
    } finally {
      setDeleteWorkId(null);
    }
  };

  if (!user) {
    return (
      <div className="mb-12 sm:mb-16 px-3 sm:px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Meus Trabalhos</h2>
        <Card className="shadow-lg text-center p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4">
            <LogIn className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-base sm:text-lg">
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

  const inProgressWorks = works.filter(work => !work.isComplete);
  const completedWorks = works.filter(work => work.isComplete);

  // Limita a exibição a 5 trabalhos se showAllWorks for false
  const displayedInProgressWorks = showAllWorks ? inProgressWorks : inProgressWorks.slice(0, 5);
  const displayedCompletedWorks = showAllWorks ? completedWorks : completedWorks.slice(0, 5);

  // Verifica se há mais trabalhos além dos exibidos
  const hasMoreWorks = inProgressWorks.length > 5 || completedWorks.length > 5;

  return (
    <div className="mb-12 sm:mb-16 px-3 sm:px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
        {isAdmin ? "Todos os Trabalhos (10 mais recentes)" : "Meus Trabalhos"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BookText className="h-5 w-5" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm sm:text-base">Carregando...</p>
            ) : displayedInProgressWorks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {displayedInProgressWorks.map((work: any) => (
                  <div
                    key={work.id}
                    className="flex flex-col p-3 sm:p-4 rounded-lg border hover:bg-accent transition-colors relative"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleWorkClick(work)}
                    >
                      <div className="flex items-start justify-between pr-8">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base line-clamp-2">{work.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getWorkTypeName(work.work_type)}
                            </Badge>
                            <p className="hidden sm:inline">ID: {work.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-0.5">
                        {isAdmin && work.userEmail && (
                          <p className="font-medium text-primary">Usuário: {work.userEmail}</p>
                        )}
                        <p>Criado: {formatDate(work.created_at)}</p>
                        <p>Modificado: {formatDate(work.last_modified)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteWorkId(work.id);
                      }}
                      style={{ display: work.user_id === user?.id ? 'flex' : 'none' }}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm sm:text-base">Nenhum trabalho em andamento</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-5 w-5" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm sm:text-base">Carregando...</p>
            ) : displayedCompletedWorks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {displayedCompletedWorks.map((work: any) => (
                  <div
                    key={work.id}
                    className="flex flex-col p-3 sm:p-4 rounded-lg border hover:bg-accent transition-colors relative"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleWorkClick(work)}
                    >
                      <div className="flex items-start justify-between pr-8">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base line-clamp-2">{work.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getWorkTypeName(work.work_type)}
                            </Badge>
                            <p className="hidden sm:inline">ID: {work.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-0.5">
                        {isAdmin && work.userEmail && (
                          <p className="font-medium text-primary">Usuário: {work.userEmail}</p>
                        )}
                        <p>Criado: {formatDate(work.created_at)}</p>
                        <p>Modificado: {formatDate(work.last_modified)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteWorkId(work.id);
                      }}
                      style={{ display: work.user_id === user?.id ? 'flex' : 'none' }}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm sm:text-base">Nenhum trabalho concluído</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Botão Ver Mais */}
      {!isAdmin && hasMoreWorks && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAllWorks(!showAllWorks)}
            className="w-full sm:w-auto"
          >
            {showAllWorks ? "Ver menos" : "Ver mais"}
          </Button>
        </div>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!deleteWorkId} onOpenChange={(open) => !open && setDeleteWorkId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o trabalho
              selecionado e removerá todos os dados do nosso servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWork} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkInProgress;
