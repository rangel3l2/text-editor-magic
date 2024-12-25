import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle2, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function LoginButton() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Login realizado com sucesso!",
        description: "Você está conectado com sua conta Google.",
      });
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: "Erro ao realizar login",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all queries from the cache before signing out
      queryClient.clear();
      await signOut();
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Erro ao realizar logout",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.user_metadata?.avatar_url} 
              alt={user.user_metadata?.full_name || user.email} 
            />
            <AvatarFallback>
              {(user.user_metadata?.full_name?.[0] || user.email?.[0])?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
            {user.user_metadata?.full_name || user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
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
          <span className="hidden sm:inline">Entrar com Google</span>
        </Button>
      )}
    </div>
  );
}