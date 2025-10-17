import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AcademicWorkTypeManagement from "@/components/admin/AcademicWorkTypeManagement";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsAdminOrModerator } from "@/hooks/useUserRole";

const AdminSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is admin or moderator using new role system
  const { data: isAdminOrModerator, isLoading } = useIsAdminOrModerator(user);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (!isLoading && !isAdminOrModerator) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, isAdminOrModerator, isLoading, navigate, toast]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAdminOrModerator) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Configurações de Administrador</h1>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="work-types">Tipos de Trabalho</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminUserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Trabalho Acadêmico</CardTitle>
            </CardHeader>
            <CardContent>
              <AcademicWorkTypeManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;