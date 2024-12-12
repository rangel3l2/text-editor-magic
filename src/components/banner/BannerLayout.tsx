import Header from '../Header';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BannerPreview from './BannerPreview';

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
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {children}
        </div>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
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