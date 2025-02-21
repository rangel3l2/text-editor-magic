
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText, FileText, LogIn, Download, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const WorkInProgress = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAllWorks, setShowAllWorks] = useState(false);

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
    queryKey: ['works-basic', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: dbWorks, error } = await supabase
        .from('work_in_progress')
        .select('id, title, work_type, created_at, last_modified, content->isComplete')
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

      return dbWorks || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const handleDownloadPDF = async (work: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { content: work.content }
      });

      if (error) throw error;

      const pdfBlob = new Blob([Buffer.from(data.pdf, 'base64')], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${work.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "Seu arquivo PDF foi gerado com sucesso",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (work: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { content: work.content }
      });

      if (error) throw error;

      const pdfBlob = new Blob([Buffer.from(data.pdf, 'base64')], { type: 'application/pdf' });
      const file = new File([pdfBlob], `${work.title}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: work.title,
          text: 'Compartilhar trabalho acadêmico'
        });
        
        toast({
          title: "Compartilhamento iniciado",
          description: "Escolha como deseja compartilhar seu trabalho",
        });
      } else {
        // Fallback para WhatsApp Web se o compartilhamento nativo não estiver disponível
        const url = window.URL.createObjectURL(pdfBlob);
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${work.title}\n${url}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o arquivo",
        variant: "destructive",
      });
    }
  };

  const getWorkTypeName = (workType: string) => {
    const type = workTypes?.find(t => t.name.toLowerCase().replace(/\s+/g, '') === workType.toLowerCase());
    return type?.name || workType;
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
        {/* Trabalhos em Andamento */}
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
            ) : works.filter(w => !w.isComplete).length > 0 ? (
              <div className="space-y-4">
                {works
                  .filter(w => !w.isComplete)
                  .slice(0, showAllWorks ? undefined : 5)
                  .map((work) => (
                    <div
                      key={work.id}
                      className="flex flex-col p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{work.title}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {getWorkTypeName(work.work_type)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(work);
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(work);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
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

        {/* Trabalhos Concluídos */}
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
            ) : works.filter(w => w.isComplete).length > 0 ? (
              <div className="space-y-4">
                {works
                  .filter(w => w.isComplete)
                  .slice(0, showAllWorks ? undefined : 5)
                  .map((work) => (
                    <div
                      key={work.id}
                      className="flex flex-col p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{work.title}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {getWorkTypeName(work.work_type)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(work);
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(work);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Concluído em: {formatDate(work.last_modified)}</p>
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

      {works.length > 5 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAllWorks(!showAllWorks)}
          >
            {showAllWorks ? "Ver menos" : "Ver mais"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkInProgress;
