import { Button } from "@/components/ui/button";
import { FileDown, RotateCcw, Share2, Trash2, Eye } from "lucide-react";

interface BannerActionsProps {
  onGeneratePDF: () => void;
  onShare: () => void;
  onLoadSavedContent: () => void;
  onClearFields: () => void;
  onOpenPreview: () => void;
  onSave: () => void;
  isAuthenticated?: boolean;
}

const BannerActions = ({ 
  onGeneratePDF, 
  onShare, 
  onLoadSavedContent, 
  onClearFields,
  onOpenPreview,
  onSave,
  isAuthenticated = false
}: BannerActionsProps) => {
  return (
    <div className="hidden sm:flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      {isAuthenticated && (
        <Button 
          onClick={onLoadSavedContent}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Recuperar Dados Salvos</span>
          <span className="sm:hidden">Recuperar</span>
        </Button>
      )}
      <Button 
        onClick={onGeneratePDF}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
      >
        <FileDown className="h-4 w-4" />
        <span className="hidden sm:inline">Baixar PDF</span>
        <span className="sm:hidden">Baixar</span>
      </Button>
      <Button 
        onClick={onOpenPreview}
        variant="outline"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">Visualizar Banner</span>
        <span className="sm:hidden">Visualizar</span>
      </Button>
      <Button 
        onClick={onShare}
        variant="secondary"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Compartilhar</span>
        <span className="sm:hidden">Compartilhar</span>
      </Button>
      <Button
        onClick={onClearFields}
        variant="destructive"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">Limpar Campos</span>
        <span className="sm:hidden">Limpar</span>
      </Button>
    </div>
  );
};

export default BannerActions;