import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import { useToast } from "@/components/ui/use-toast";

const AdminSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return data?.is_admin || false;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (!isLoading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate, toast]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Configurações de Administrador</h1>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUserManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;