import { LoginButton } from "./LoginButton";
import { Settings, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useUserRole";
import MobileMenu from "./header/MobileMenu";
import AdminSettingsDialog from "./header/AdminSettingsDialog";

const Header = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: isAdmin, isLoading } = useIsAdmin(user);
  const [inputValue, setInputValue] = useState("");

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenu 
            isAdmin={isAdmin || false} 
            onSettingsClick={() => setIsSettingsOpen(true)} 
          />
          
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
          <input 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            className="border rounded px-2 py-1"
          />
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
          {!isLoading && isAdmin && (
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

      <AdminSettingsDialog 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </header>
  );
};

export default Header;