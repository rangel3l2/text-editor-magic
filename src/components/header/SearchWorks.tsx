import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Work {
  id: string;
  title: string;
  work_type: string;
  last_modified: string;
}

export const SearchWorks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Work[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para buscar trabalhos",
        variant: "destructive",
      });
      return;
    }

    if (!searchQuery.trim()) {
      toast({
        title: "Aviso",
        description: "Digite algo para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setIsSearchOpen(true);

    try {
      const { data, error } = await supabase
        .rpc("search_works_by_title", {
          p_user_id: user.id,
          p_search_term: searchQuery.trim(),
        });

      if (error) throw error;

      setSearchResults(data || []);

      if (!data || data.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Não foram encontrados trabalhos com este título",
        });
      }
    } catch (error) {
      console.error("Error searching works:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os trabalhos",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleWorkClick = (work: Work) => {
    const editorRoutes: Record<string, string> = {
      "Artigo Científico": "/article-editor",
      "Monografia": "/monography-editor",
      "TCC": "/thesis-editor",
      "Projeto de Intervenção": "/intervention-project-editor",
    };

    const route = editorRoutes[work.work_type];
    if (route) {
      navigate(`${route}?id=${work.id}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Buscar trabalhos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-32 sm:w-48"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching || !user}
          title="Localizar trabalhos"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados da Busca</DialogTitle>
            <DialogDescription>
              {searchResults.length > 0
                ? `Encontrados ${searchResults.length} trabalho(s)`
                : "Nenhum trabalho encontrado"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {searchResults.map((work) => (
              <div
                key={work.id}
                className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleWorkClick(work)}
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium">{work.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{work.work_type}</span>
                      <span>•</span>
                      <span>
                        Modificado em{" "}
                        {format(new Date(work.last_modified), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
