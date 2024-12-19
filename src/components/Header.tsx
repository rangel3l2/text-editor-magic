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

const Header = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
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
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;