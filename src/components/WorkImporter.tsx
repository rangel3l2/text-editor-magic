import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface WorkImporterProps {
  workType: "article" | "banner";
  onWorkParsed: (content: any) => void;
}

export const WorkImporter = ({ workType, onWorkParsed }: WorkImporterProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie um arquivo PDF ou DOCX.",
          variant: "destructive"
        });
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 20MB.",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const parseWorkContent = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setStatus("Preparando arquivo...");

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simula progresso mais linear e contínuo
      const simulateProgress = (from: number, to: number, duration: number) => {
        const steps = Math.floor(duration / 50);
        const increment = (to - from) / steps;
        let current = from;
        
        return setInterval(() => {
          current = Math.min(current + increment, to);
          setProgress(Math.floor(current));
        }, 50);
      };

      // Fase 1: Upload (0-20%)
      setStatus("Enviando arquivo...");
      const uploadInterval = simulateProgress(0, 20, 800);
      await new Promise(resolve => setTimeout(resolve, 800));
      clearInterval(uploadInterval);
      setProgress(20);

      // Fase 2: Processamento inicial (20-40%)
      setStatus("Extraindo texto do documento...");
      const extractInterval = simulateProgress(20, 40, 1000);
      
      const endpoint = workType === "article" ? "parse-article" : "parse-banner";
      
      // Inicia a chamada para o backend
      const responsePromise = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(extractInterval);
      setProgress(40);

      // Fase 3: Análise com IA (40-85%) - PROGRESSO CONTÍNUO DURANTE A CHAMADA
      setStatus("Analisando conteúdo com IA...");
      const aiInterval = simulateProgress(40, 85, 3000); // 3 segundos de progresso suave
      
      // Aguarda a resposta enquanto o progresso continua
      const response = await responsePromise;
      
      clearInterval(aiInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar documento');
      }

      const parsedContent = await response.json();
      
      // Fase 4: Finalização (85-100%)
      setStatus("Preenchendo campos...");
      setProgress(85);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(92);
      
      onWorkParsed(parsedContent);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(100);
      setStatus("Concluído!");

      toast({
        title: "✅ Trabalho importado com sucesso!",
        description: "Todos os campos foram preenchidos automaticamente. Revise o conteúdo.",
      });

      // Resetar após 1 segundo
      setTimeout(() => {
        setOpen(false);
        setFile(null);
        setProgress(0);
        setStatus("");
      }, 1000);

    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast({
        title: "Erro ao importar trabalho",
        description: error instanceof Error ? error.message : "Não foi possível extrair o conteúdo.",
        variant: "destructive"
      });
      setProgress(0);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const workTypeLabel = workType === "article" ? "Artigo" : "Banner";

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full justify-start gap-3"
      >
        <Upload className="h-5 w-5" />
        Importar Trabalho
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!loading) {
          setOpen(isOpen);
          if (!isOpen) {
            setFile(null);
            setProgress(0);
            setStatus("");
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar {workTypeLabel}</DialogTitle>
            <DialogDescription>
              Faça upload de um {workTypeLabel.toLowerCase()} completo para extrair automaticamente
              todas as seções e preencher os campos do editor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!loading ? (
              <>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="work-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  
                  <label
                    htmlFor="work-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-sm">
                      {file ? (
                        <span className="font-medium">{file.name}</span>
                      ) : (
                        <>
                          <span className="font-medium text-primary">Clique para selecionar</span>
                          <span className="text-muted-foreground"> ou arraste o arquivo aqui</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PDF ou DOCX (máx. 20MB)</p>
                  </label>
                </div>

                {file && (
                  <Button
                    onClick={parseWorkContent}
                    disabled={loading}
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Processar e Preencher Campos
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  {progress < 100 ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{status}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file?.name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {progress}%
                  </span>
                </div>
                
                <Progress value={progress} className="h-2" />
                
                <p className="text-xs text-muted-foreground text-center">
                  {progress < 100 
                    ? "Aguarde enquanto processamos seu documento..." 
                    : "Processamento concluído!"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
