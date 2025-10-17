import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [searchResults, setSearchResults] = useState<Work[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-search with debounce
  useEffect(() => {
    if (!user) {
      console.log("Usuário não logado");
      return;
    }
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    console.log("Iniciando busca para:", searchQuery);
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        console.log("Executando RPC com user_id:", user.id, "termo:", searchQuery.trim());
        
        const { data, error } = await supabase
          .rpc("search_works_by_title", {
            p_user_id: user.id,
            p_search_term: searchQuery.trim(),
          });

        console.log("Resposta da busca:", { data, error });

        if (error) {
          console.error("Erro na busca:", error);
          throw error;
        }

        console.log("Resultados encontrados:", data?.length || 0);
        setSearchResults(data || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching works:", error);
        toast({
          title: "Erro",
          description: "Não foi possível buscar os trabalhos",
          variant: "destructive",
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user, toast]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWorkClick = (work: Work) => {
    console.log("Clicou no trabalho:", work);
    
    const editorRoutes: Record<string, string> = {
      "Artigo Científico": "/article-editor",
      "Monografia": "/monography-editor",
      "TCC": "/thesis-editor",
      "Projeto de Intervenção": "/intervention-project-editor",
      "banner": "/", // Banner não tem editor específico, volta para home
    };

    const route = editorRoutes[work.work_type];
    console.log("Tipo de trabalho:", work.work_type);
    console.log("Rota encontrada:", route);
    
    if (route && route !== "/") {
      const fullRoute = `${route}?id=${work.id}`;
      console.log("Navegando para:", fullRoute);
      navigate(fullRoute);
      setShowResults(false);
      setSearchQuery("");
    } else if (work.work_type === "banner") {
      console.log("Tipo banner - não tem editor de busca");
      toast({
        title: "Aviso",
        description: "Este é um trabalho de banner e não pode ser editado pela busca",
      });
    } else {
      console.error("Rota não encontrada para o tipo:", work.work_type);
      toast({
        title: "Erro",
        description: "Tipo de trabalho não reconhecido: " + work.work_type,
        variant: "destructive",
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar trabalhos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            disabled={!user}
            className="w-32 sm:w-56 pl-8 pr-8"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showResults && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 min-w-[300px] sm:min-w-[400px]">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Buscando...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((work) => (
                <div
                  key={work.id}
                  className="px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0"
                  onClick={() => handleWorkClick(work)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{work.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="truncate">{work.work_type}</span>
                        <span>•</span>
                        <span className="truncate">
                          {format(new Date(work.last_modified), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhum trabalho encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};
