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
      const { data: existingWorks, error: existingError } = await supabase
        .from('work_in_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('work_type', 'banner')
        .is('content', null)
        .limit(1);

      if (existingError) throw existingError;

      if (existingWorks && existingWorks.length > 0) {
        navigate(`/banner/${existingWorks[0].id}`);
        return;
      }

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
    let isMounted = true;

    const loadWork = async () => {
      if (!isMounted) return;

      try {
        setIsLoading(true);

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
          .maybeSingle();

        if (error) throw error;

        if (data?.content) {
          if (isMounted) {
            setBannerContent(data.content);
          }
          return;
        }

        // If not found in database, try localStorage
        const localStorageKey = `banner_work_${user?.id || 'anonymous'}_${id}`;
        const savedWork = localStorage.getItem(localStorageKey);
        
        if (savedWork) {
          try {
            const parsedWork = JSON.parse(savedWork);
            if (parsedWork.content && isMounted) {
              setBannerContent(parsedWork.content);
              return;
            }
          } catch (error) {
            console.error('Error parsing local work:', error);
          }
        }

        if (isMounted) {
          toast({
            title: "Trabalho não encontrado",
            description: "Não foi possível encontrar o trabalho solicitado.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading work:', error);
        if (isMounted) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Não foi possível carregar o trabalho. Verifique sua conexão.",
            variant: "destructive",
          });
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWork();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  // Save work in progress whenever content changes
  useEffect(() => {
    if (isLoading || !id || isCreating || !user) return;

    const saveWork = async () => {
      const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || 'Trabalho sem título';
      
      const localStorageKey = `banner_work_${user.id}_${id}`;
      const workData = {
        title: workTitle,
        content: bannerContent,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(localStorageKey, JSON.stringify(workData));

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
          description: "Não foi possível salvar seu trabalho na nuvem. Uma cópia local foi mantida.",
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