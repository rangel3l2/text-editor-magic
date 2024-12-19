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
      <main className="pt-16 pb-20 sm:pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {children}
        </div>
      </main>

      {/* Navegação inferior móvel */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around items-center sm:hidden">
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
          <Eye className="h-5 w-5" />
          <span className="text-xs">Visualizar</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
          <FileDown className="h-5 w-5" />
          <span className="text-xs">Baixar</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
          <Share2 className="h-5 w-5" />
          <span className="text-xs">Compartilhar</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
          <RotateCcw className="h-5 w-5" />
          <span className="text-xs">Recuperar</span>
        </Button>
      </nav>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent 
          className="max-w-[95vw] h-[95vh] p-4"
          style={{
            width: 'calc(210mm * 0.9)',
            maxHeight: '95vh',
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