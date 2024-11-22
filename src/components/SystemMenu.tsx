import { Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SystemMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show menu on index page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
            <Menu className="h-6 w-6 text-primary" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => navigate("/")}>
            Voltar para Início
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SystemMenu;