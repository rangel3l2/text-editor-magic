import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
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
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start h-12 text-base font-medium hover:bg-accent"
            onClick={() => navigate("/")}
          >
            Início
          </Button>
          <Button
            variant="ghost"
            className="justify-start h-12 text-base font-medium hover:bg-accent"
            onClick={() => navigate("/banner")}
          >
            Criar Banner
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              className="justify-start h-12 text-base font-medium hover:bg-accent flex items-center gap-2"
              onClick={onSettingsClick}
            >
              <Settings className="h-5 w-5" />
              Configurações de Admin
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;