import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import BannerHeaderSection from './BannerHeaderSection';
import BannerContentSection from './BannerContentSection';
import BannerPreview from './BannerPreview';
import ImageEditor from './ImageEditor';

interface BannerContentProps {
  content: any;
  handleChange: (field: string, value: string) => void;
  selectedImage: string | null;
  onImageConfigChange: (imageId: string, config: any) => void;
  onOpenPreview: () => void;
}

const BannerContent = ({ 
  content, 
  handleChange, 
  selectedImage, 
  onImageConfigChange,
  onOpenPreview
}: BannerContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
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
      </div>
      
      <div className="space-y-6">
        <Button 
          onClick={onOpenPreview}
          className="w-full"
          variant="outline"
        >
          <Eye className="mr-2 h-4 w-4" />
          Visualizar Banner
        </Button>
        
        {selectedImage && (
          <ImageEditor
            imageUrl={selectedImage}
            config={{}}
            onConfigChange={(config) => {
              onImageConfigChange(selectedImage, config);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BannerContent;