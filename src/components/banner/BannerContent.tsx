import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BannerHeaderSection from './BannerHeaderSection';
import BannerContentSection from './BannerContentSection';
import ImageEditor from './ImageEditor';

interface BannerContentProps {
  content: any;
  handleChange: (field: string, value: string) => void;
  selectedImage: string | null;
  onImageConfigChange: (imageId: string, config: any) => void;
  onImageUploadFromEditor?: (file: File) => void;
  pendingImageFile?: File | null;
  onImageProcessed?: () => void;
}

const BannerContent = ({ 
  content, 
  handleChange, 
  selectedImage, 
  onImageConfigChange,
  onImageUploadFromEditor,
  pendingImageFile,
  onImageProcessed,
}: BannerContentProps) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="header" className="text-xs sm:text-sm py-2">
            Cabeçalho do Banner
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs sm:text-sm py-2">
            Conteúdo do Banner
          </TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-4">
          <BannerHeaderSection content={content} handleChange={handleChange} />
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          <BannerContentSection 
            content={content} 
            handleChange={handleChange}
            onImageUploadFromEditor={onImageUploadFromEditor}
          />
        </TabsContent>
      </Tabs>
      
      {selectedImage && (
        <div className="mt-6">
          <ImageEditor
            imageUrl={selectedImage}
            config={{}}
            onConfigChange={(config) => {
              onImageConfigChange(selectedImage, config);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BannerContent;