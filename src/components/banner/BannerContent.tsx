import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BannerHeaderSection from './BannerHeaderSection';
import BannerContentSection from './BannerContentSection';
import ImageEditor from './ImageEditor';

interface BannerContentProps {
  content: any;
  handleChange: (field: string, value: string) => void;
  selectedImage: string | null;
  onImageConfigChange: (imageId: string, config: any) => void;
}

const BannerContent = ({ 
  content, 
  handleChange, 
  selectedImage, 
  onImageConfigChange,
}: BannerContentProps) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="header">Cabeçalho do Banner</TabsTrigger>
          <TabsTrigger value="content">Conteúdo do Banner</TabsTrigger>
        </TabsList>
        <TabsContent value="header">
          <BannerHeaderSection content={content} handleChange={handleChange} />
        </TabsContent>
        <TabsContent value="content">
          <BannerContentSection content={content} handleChange={handleChange} />
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