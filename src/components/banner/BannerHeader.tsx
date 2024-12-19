import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, Share2, Eye, MoreHorizontal, Trash2 } from "lucide-react";

interface BannerHeaderProps {
  title: string;
  onGeneratePDF: () => void;
  onShare: () => void;
  onOpenPreview: () => void;
  onClearFields: () => void;
}

const BannerHeader = ({ 
  title, 
  onGeneratePDF, 
  onShare, 
  onOpenPreview,
  onClearFields 
}: BannerHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onGeneratePDF} className="cursor-pointer">
            <FileDown className="mr-2 h-4 w-4" />
            <span>Baixar PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenPreview} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            <span>Visualizar Banner</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4" />
            <span>Compartilhar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClearFields} className="cursor-pointer text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Limpar Campos</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BannerHeader;