import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
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
    <div className="flex items-center gap-1 sm:gap-2">
      {user ? (
        <div className="flex items-center gap-1 sm:gap-2">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage 
              src={user.user_metadata?.avatar_url} 
              alt={user.user_metadata?.full_name || user.email} 
            />
            <AvatarFallback className="text-xs sm:text-sm">
              {(user.user_metadata?.full_name?.[0] || user.email?.[0])?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs sm:text-sm text-foreground hidden md:inline truncate max-w-[100px] lg:max-w-[150px]">
            {user.user_metadata?.full_name || user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 sm:gap-2 hover:bg-destructive/10 h-8 sm:h-9 px-2 sm:px-3"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Sair</span>
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleLogin}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 h-8 sm:h-9 px-2 sm:px-3"
        >
          <svg 
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" 
            viewBox="0 0 24 24"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="hidden xs:inline text-xs sm:text-sm">Entrar</span>
        </Button>
      )}
    </div>
  );
}