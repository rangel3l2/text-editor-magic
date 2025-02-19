
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadHandlerProps {
  onSuccess: (imageUrl: string) => void;
}

const ImageUploadHandler = ({ onSuccess }: ImageUploadHandlerProps) => {
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    try {
      const maxSizeMB = 2;
      const maxWidthPx = 800;
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `A imagem deve ter no máximo ${maxSizeMB}MB`,
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width > maxWidthPx) {
            toast({
              title: "Imagem muito larga",
              description: "A largura da imagem deve ser menor que 800px (~7.5cm)",
              variant: "destructive",
              duration: 3000,
            });
            resolve(null);
          } else {
            const imageUrl = URL.createObjectURL(file);
            toast({
              title: "Imagem adicionada",
              description: "A imagem foi inserida com sucesso",
              duration: 2000,
            });
            onSuccess(imageUrl);
            resolve(imageUrl);
          }
        };
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast({
        title: "Erro ao fazer upload da imagem",
        description: "Não foi possível fazer o upload da imagem. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }
  };

  return { handleImageUpload };
};

export default ImageUploadHandler;
