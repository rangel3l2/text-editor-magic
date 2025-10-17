import Header from '../Header';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BannerPreview from './BannerPreview';
import { FileDown, Share2, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerLayoutProps {
  children: React.ReactNode;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  content: any;
  onImageConfigChange: (imageId: string, config: any) => void;
}

const BannerLayout = ({ 
  children, 
  previewOpen, 
  setPreviewOpen, 
  content, 
  onImageConfigChange 
}: BannerLayoutProps) => {
  return (
    <>
      <Header />
      <main className="pt-16 pb-20 sm:pb-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl">
          {children}
        </div>
      </main>

      {/* Navegação inferior móvel */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 dark:bg-background/98 backdrop-blur-md border-t shadow-lg p-2 flex justify-around items-center sm:hidden z-40">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 hover:bg-accent transition-colors"
        >
          <Eye className="h-5 w-5" />
          <span className="text-[10px] font-medium">Visualizar</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 hover:bg-accent transition-colors"
        >
          <FileDown className="h-5 w-5" />
          <span className="text-[10px] font-medium">Baixar</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 hover:bg-accent transition-colors"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Compartilhar</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
          <span className="text-[10px] font-medium">Recuperar</span>
        </Button>
      </nav>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-[90vw] h-[90vh] sm:h-[95vh] p-3 sm:p-4"
          style={{
            width: '95vw',
            maxWidth: 'min(calc(210mm * 0.9), 95vw)',
            maxHeight: '90vh',
            margin: '0 auto',
          }}
        >
          <BannerPreview 
            content={content}
            onImageConfigChange={onImageConfigChange}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BannerLayout;