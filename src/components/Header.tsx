import { LoginButton } from "./LoginButton";
import { Settings, Menu, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserManagement from "./admin/AdminUserManagement";
import AcademicWorkTypeManagement from "./admin/AcademicWorkTypeManagement";

const Header = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: isAdmin, refetch: refetchAdminStatus } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("No user logged in");
        return false;
      }
      
      console.log("Checking admin status for user:", user.email);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      console.log("Admin status response:", data);
      console.log("Is admin value:", data?.is_admin);
      return data?.is_admin || false;
    },
    enabled: !!user,
    staleTime: 0, // Always refetch when the query is triggered
    gcTime: 0, // Don't cache the result (previously cacheTime)
  });

  useEffect(() => {
    if (user) {
      console.log("User changed, refetching admin status");
      refetchAdminStatus();
    }
  }, [user, refetchAdminStatus]);

  // Log whenever isAdmin changes
  useEffect(() => {
    console.log("Current admin status:", isAdmin);
  }, [isAdmin]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-4">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => navigate("/")}
                  >
                    Início
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => navigate("/banner")}
                  >
                    Criar Banner
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      Configurações de Admin
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <img
                src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png"
                alt="AIcademic Logo"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg hidden sm:inline">AIcademic</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <LoginButton />
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="focus:outline-none"
              >
                <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configurações do Sistema</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="work-types" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="work-types">Tipos de Trabalho</TabsTrigger>
              <TabsTrigger value="users">Gerenciar Administradores</TabsTrigger>
            </TabsList>
            <TabsContent value="work-types" className="mt-4">
              <AcademicWorkTypeManagement />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <AdminUserManagement />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;