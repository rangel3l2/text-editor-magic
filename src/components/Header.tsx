import { LoginButton } from "./LoginButton";
import { Settings, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdminOrModerator } from "@/hooks/useUserRole";
import MobileMenu from "./header/MobileMenu";
import AdminSettingsDialog from "./header/AdminSettingsDialog";
import { SearchWorks } from "./header/SearchWorks";

const Header = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: isAdminOrModerator, isLoading } = useIsAdminOrModerator(user);

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md border-b z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <MobileMenu 
            isAdmin={isAdminOrModerator || false} 
            onSettingsClick={() => setIsSettingsOpen(true)} 
          />
          
          <div 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer min-w-0" 
            onClick={() => navigate("/")}
          >
            <img
              src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png"
              alt="AIcademic Logo"
              className="h-7 sm:h-8 w-auto flex-shrink-0"
            />
            <span className="font-semibold text-base sm:text-lg hidden xs:inline truncate">AIcademic</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden sm:block">
            <SearchWorks />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          <LoginButton />
          {!isLoading && isAdminOrModerator && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="h-9 w-9 hidden sm:flex"
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