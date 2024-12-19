import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useSearchParams } from "react-router-dom";

const BannerEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bannerType = searchParams.get("type") || "banner";

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [institution, setInstitution] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [orientation, setOrientation] = useState("portrait");
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const handleBeforeInput = () => {
      if (!user) {
        toast({
          title: "Login Necessário",
          description: "Para editar o banner, faça login primeiro.",
          duration: 5000,
        });
        navigate("/?redirect=banner");
        return false;
      }
      return true;
    };

    document.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      document.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [user, toast, navigate]);

  const handleSave = () => {
    // Implement save functionality
    toast({
      title: "Sucesso!",
      description: "Banner salvo com sucesso.",
    });
  };

  const handleExport = () => {
    // Implement export functionality
    toast({
      title: "Exportando...",
      description: "Seu banner está sendo exportado.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Editor de {bannerType === "banner" ? "Banner" : "Trabalho"} Acadêmico</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="style">Estilo</TabsTrigger>
              <TabsTrigger value="preview">Visualização</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do seu trabalho"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authors">Autores</Label>
                <Input
                  id="authors"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Nome dos autores (separados por vírgula)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Instituição</Label>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Nome da instituição"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract">Resumo</Label>
                <Textarea
                  id="abstract"
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Digite o resumo do seu trabalho"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Palavras-chave</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Palavras-chave (separadas por vírgula)"
                />
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientação</Label>
                <Select value={orientation} onValueChange={setOrientation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a orientação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-logo"
                  checked={showLogo}
                  onCheckedChange={setShowLogo}
                />
                <Label htmlFor="show-logo">Mostrar logo da instituição</Label>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="min-h-[400px]">
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Visualização em desenvolvimento</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleSave}>
              Salvar
            </Button>
            <Button onClick={handleExport}>
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerEditor;