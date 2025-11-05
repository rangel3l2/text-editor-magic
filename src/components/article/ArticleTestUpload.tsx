import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ArticleContent } from "@/hooks/useArticleContent";

interface ArticleTestUploadProps {
  onArticleParsed: (content: Partial<ArticleContent>) => void;
}

export const ArticleTestUpload = ({ onArticleParsed }: ArticleTestUploadProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
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

      setFile(selectedFile);
    }
  };

  const parseArticleContent = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);

      // Enviar para edge function que vai processar o documento
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-article`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar artigo');
      }

      const parsedContent = await response.json();
      
      console.log('Conteúdo extraído:', parsedContent);
      
      // Preencher os campos do editor
      onArticleParsed(parsedContent);

      toast({
        title: "Artigo processado com sucesso!",
        description: "Todos os campos foram preenchidos automaticamente.",
      });

      setOpen(false);
      setFile(null);
    } catch (error) {
      console.error('Erro ao processar artigo:', error);
      toast({
        title: "Erro ao processar artigo",
        description: error instanceof Error ? error.message : "Não foi possível extrair o conteúdo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Testar Artigo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Artigo (Admin)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de um artigo completo (PDF ou DOCX) para extrair automaticamente
              todas as seções e preencher os campos do editor.
            </p>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                id="article-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={loading}
              />
              
              <label
                htmlFor="article-upload"
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
                onClick={parseArticleContent}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando artigo...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Processar e Preencher Campos
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
