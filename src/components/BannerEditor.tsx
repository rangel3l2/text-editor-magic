import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useEffect, useState } from "react";
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
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Create new work entry
  const createNewWork = async () => {
    if (!user || isCreating) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('work_in_progress')
        .insert([
          {
            user_id: user.id,
            title: 'Novo Banner',
            work_type: 'banner',
            content: initialBannerContent,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        navigate(`/banner/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating new work:', error);
      toast({
        title: "Erro ao criar trabalho",
        description: "Não foi possível criar um novo trabalho.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Load existing work if ID is provided
  useEffect(() => {
    const loadWork = async () => {
      try {
        if (!id) {
          if (user) {
            await createNewWork();
          }
          return;
        }

        if (!user) {
          navigate('/');
          return;
        }

        const { data, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          throw error;
        }
        
        if (data?.content) {
          setBannerContent(data.content);
        }
      } catch (error) {
        console.error('Error in loadWork:', error);
        toast({
          title: "Erro ao carregar trabalho",
          description: "Não foi possível carregar o trabalho. Verifique sua conexão.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isLoading) {
      loadWork();
    }

    return () => {
      // Cleanup
    };
  }, [id, user, isLoading]);

  // Save work in progress whenever content changes
  useEffect(() => {
    if (!id || !user || isLoading || isCreating) {
      return;
    }

    const saveWork = async () => {
      const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || 'Trabalho sem título';
      
      try {
        const { error } = await supabase
          .from('work_in_progress')
          .update({
            title: workTitle,
            content: bannerContent,
            last_modified: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error saving work:', error);
        toast({
          title: "Erro ao salvar trabalho",
          description: "Não foi possível salvar seu trabalho na nuvem.",
          variant: "destructive",
        });
      }
    };

    if (!isLoading && (content.title || Object.values(content).some(value => value))) {
      saveWork();
    }
  }, [content, bannerContent, user, id, isLoading, isCreating]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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