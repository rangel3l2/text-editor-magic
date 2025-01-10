import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import BannerLayout from "./banner/BannerLayout";
import BannerHeader from "./banner/BannerHeader";
import BannerContent from "./banner/BannerContent";
import BannerActions from "./banner/BannerActions";
import { useBannerContent } from "./banner/useBannerContent";
import { useBannerActions } from "./banner/useBannerActions";

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
      // Salvar no localStorage
      const localStorageKey = `banner_work_${user?.id || 'anonymous'}_${id || 'new'}`;
      localStorage.setItem(localStorageKey, JSON.stringify({
        title: content.title || 'Trabalho sem título',
        content: bannerContent,
        lastModified: new Date().toISOString()
      }));

      // Se não estiver logado, apenas salva no localStorage
      if (!user) {
        toast({
          title: "Trabalho salvo localmente",
          description: "Faça login para salvar seu trabalho na nuvem.",
          variant: "default",
        });
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
          description: "Seu progresso foi salvo com sucesso na nuvem.",
        });
      } catch (error) {
        console.error('Error saving work:', error);
        toast({
          title: "Erro ao salvar trabalho",
          description: "Não foi possível salvar seu trabalho na nuvem. Uma cópia local foi mantida.",
          variant: "destructive",
        });
      }
    };

    // Debounce save to avoid too many calls
    const timeoutId = setTimeout(saveWork, 2000);
    return () => clearTimeout(timeoutId);
  }, [content, bannerContent, user, id, toast, navigate]);

  // Carregar trabalho salvo no localStorage ao iniciar
  useEffect(() => {
    const localStorageKey = `banner_work_${user?.id || 'anonymous'}_${id || 'new'}`;
    const savedWork = localStorage.getItem(localStorageKey);
    
    if (savedWork) {
      try {
        const { content: savedContent } = JSON.parse(savedWork);
        setBannerContent(savedContent);
      } catch (error) {
        console.error('Error loading local work:', error);
      }
    }
  }, [id, user?.id]);

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