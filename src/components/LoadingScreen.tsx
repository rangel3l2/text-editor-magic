import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onLoadComplete?: () => void;
}

const LoadingScreen = ({ onLoadComplete }: LoadingScreenProps) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      // Get all images in the document
      const images = document.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      });

      await Promise.all(imagePromises);
      setImagesLoaded(true);
      onLoadComplete?.();
    };

    loadImages();
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center min-h-screen">
      <div className="animate-pulse mb-8">
        <img 
          src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png" 
          alt="AIcademic Logo" 
          className="w-32 h-auto"
        />
      </div>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground animate-pulse">
          {!imagesLoaded 
            ? "Carregando as imagens e conteúdo do site..."
            : "Finalizando carregamento..."}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;