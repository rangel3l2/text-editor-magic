import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileMenuProps {
  isAdmin: boolean;
  onSettingsClick: () => void;
}

const MobileMenu = ({ isAdmin, onSettingsClick }: MobileMenuProps) => {
  const navigate = useNavigate();

  return (
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
              onClick={onSettingsClick}
            >
              Configurações de Admin
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;