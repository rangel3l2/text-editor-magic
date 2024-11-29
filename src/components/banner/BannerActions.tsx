import { Button } from "@/components/ui/button";
import { FileDown, RotateCcw, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BannerActionsProps {
  onGenerateDocx: () => void;
  onShare: () => void;
  onLoadSavedContent: () => void;
  onClearFields: () => void;
  isAuthenticated: boolean;
}

const BannerActions = ({ 
  onGenerateDocx, 
  onShare, 
  onLoadSavedContent, 
  onClearFields,
  isAuthenticated 
}: BannerActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      {isAuthenticated && (
        <Button 
          onClick={onLoadSavedContent}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Recuperar Dados Salvos
        </Button>
      )}
      <Button 
        onClick={onGenerateDocx}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
      >
        <FileDown className="h-4 w-4" />
        Baixar DOCX
      </Button>
      <Button 
        onClick={onShare}
        variant="secondary"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <Share2 className="h-4 w-4" />
        Compartilhar
      </Button>
      <Button
        onClick={onClearFields}
        variant="destructive"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <Trash2 className="h-4 w-4" />
        Limpar Campos
      </Button>
    </div>
  );
};

export default BannerActions;