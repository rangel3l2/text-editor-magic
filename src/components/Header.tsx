import { LoginButton } from "./LoginButton";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img
            src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png"
            alt="AIcademic Logo"
            className="h-8 w-auto"
          />
          <span className="font-semibold text-lg hidden sm:inline">AIcademic</span>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Settings className="h-5 w-5 text-gray-600 hover:text-gray-900 transition-colors" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                Tema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <LoginButton />
        </div>
      </div>
    </header>
  );
};

export default Header;