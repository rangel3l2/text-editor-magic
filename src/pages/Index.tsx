import TextEditor from "@/components/TextEditor";
import BannerEditor from "@/components/BannerEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Content Editor</h1>
        <p className="text-gray-600 mt-2">Create and edit your content with ease</p>
      </div>
      
      <div className="container mx-auto">
        <Tabs defaultValue="banner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="banner">Banner Editor</TabsTrigger>
            <TabsTrigger value="content">Content Editor</TabsTrigger>
          </TabsList>
          <TabsContent value="banner">
            <BannerEditor />
          </TabsContent>
          <TabsContent value="content">
            <TextEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;