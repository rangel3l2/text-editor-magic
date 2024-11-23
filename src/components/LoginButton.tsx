import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle2, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function LoginButton() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Login realizado com sucesso!",
        description: "Você está conectado com sua conta Google.",
      });
    } catch (error) {
      toast({
        title: "Erro ao realizar login",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao realizar logout",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{user.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleLogin}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <UserCircle2 className="h-4 w-4" />
          Entrar com Google
        </Button>
      )}
    </div>
  );
}