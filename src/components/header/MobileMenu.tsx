import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface MobileMenuProps {
  isAdmin: boolean;
  onSettingsClick: () => void;
}

const MobileMenu = ({ isAdmin, onSettingsClick }: MobileMenuProps) => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

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
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite algo..."
            className="border p-2"
          />
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
              className="justify-start flex items-center gap-2"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
              Configurações de Admin
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;