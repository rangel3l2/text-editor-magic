import BannerLayout from "./banner/BannerLayout";
import BannerHeader from "./banner/BannerHeader";
import BannerContent from "./banner/BannerContent";
import BannerActions from "./banner/BannerActions";
import { useBannerContent } from "./banner/useBannerContent";
import { useBannerActions } from "./banner/useBannerActions";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";

const BannerEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    content,
    handleChange,
    selectedImage,
    onImageConfigChange,
    previewOpen,
    setPreviewOpen,
    bannerContent,
    setBannerContent,
    initialBannerContent,
  } = useBannerContent();

  const {
    handleGeneratePDF,
    handleShare,
    handleClearFields
  } = useBannerActions(
    bannerContent,
    setBannerContent,
    initialBannerContent,
  );

  // Save work in progress whenever content changes
  useEffect(() => {
    const saveWork = async () => {
      if (!user) {
        toast({
          title: "Faça login para salvar seu trabalho",
          description: "Você precisa estar logado para salvar seu progresso.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        if (id) {
          // Update existing work
          const { error } = await supabase
            .from('work_in_progress')
            .update({
              title: content.title || 'Trabalho sem título',
              content: bannerContent,
              last_modified: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;
        } else {
          // Create new work
          const { data, error } = await supabase
            .from('work_in_progress')
            .insert([
              {
                user_id: user.id,
                title: content.title || 'Trabalho sem título',
                work_type: 'banner',
                content: bannerContent,
              }
            ])
            .select()
            .single();

          if (error) throw error;
          
          // Navigate to the new work's URL
          navigate(`/banner/${data.id}`);
        }

        toast({
          title: "Trabalho salvo",
          description: "Seu progresso foi salvo com sucesso.",
        });
      } catch (error) {
        console.error('Error saving work:', error);
        toast({
          title: "Erro ao salvar trabalho",
          description: "Não foi possível salvar seu trabalho. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    };

    // Debounce save to avoid too many database calls
    const timeoutId = setTimeout(saveWork, 2000);
    return () => clearTimeout(timeoutId);
  }, [content, bannerContent, user, id, toast, navigate]);

  return (
    <>
      <OnboardingTutorial />
      <BannerLayout
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        content={content}
        onImageConfigChange={onImageConfigChange}
      >
        <div className="space-y-8">
          <BannerHeader 
            title={content.title || "Novo Banner"}
            previewHtml={content.previewHtml}
            onGeneratePDF={handleGeneratePDF}
            onShare={handleShare}
            onOpenPreview={() => setPreviewOpen(true)}
            onClearFields={handleClearFields}
          />
          <BannerContent
            content={content}
            handleChange={handleChange}
            selectedImage={selectedImage}
            onImageConfigChange={onImageConfigChange}
          />
          <BannerActions
            onGeneratePDF={handleGeneratePDF}
            onShare={handleShare}
            onLoadSavedContent={() => {}}
            onClearFields={handleClearFields}
            onOpenPreview={() => setPreviewOpen(true)}
            onSave={() => {}}
          />
        </div>
      </BannerLayout>
    </>
  );
};

export default BannerEditor;