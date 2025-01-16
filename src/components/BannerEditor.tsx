import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useEffect, useState, useRef } from "react";
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
import LoginRequiredModal from "./banner/LoginRequiredModal";

const BannerEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasEditedFirstField, setHasEditedFirstField] = useState(false);
  const workCreatedRef = useRef(false);
  
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

  // Generate URL-friendly slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Generate unique title for untitled works
  const generateUniqueTitle = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const randomId = Math.floor(Math.random() * 10000);
    return `Trabalho Desconhecido #${randomId} (${timestamp})`;
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!user && !hasEditedFirstField) {
      setHasEditedFirstField(true);
    } else if (!user && hasEditedFirstField) {
      setShowLoginModal(true);
      return;
    }
    handleChange(field, value);
  };

  // Load existing work if ID is provided
  useEffect(() => {
    const loadWork = async () => {
      try {
        if (!id) {
          // If no ID, check for draft in localStorage
          if (user) {
            const localStorageKey = `banner_work_${user.id}_draft`;
            const savedDraft = localStorage.getItem(localStorageKey);
            if (savedDraft) {
              const parsedDraft = JSON.parse(savedDraft);
              setBannerContent(parsedDraft.content);
            }
          }
          setIsLoading(false);
          return;
        }

        if (!user) {
          navigate('/', { replace: true });
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
          // Clear draft from localStorage when loading saved work
          localStorage.removeItem(`banner_work_${user.id}_draft`);
        }
      } catch (error) {
        console.error('Error in loadWork:', error);
        toast({
          title: "Erro ao carregar trabalho",
          description: "Não foi possível carregar o trabalho. Verifique sua conexão.",
          variant: "destructive",
        });
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadWork();
  }, [id, user]);

  // Save work in progress when content changes with debounce
  useEffect(() => {
    if (!id || !user || isLoading) return;

    const saveWork = async () => {
      const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
      
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

    const debounceTimeout = setTimeout(saveWork, 1000);
    return () => clearTimeout(debounceTimeout);
  }, [content, bannerContent, user, id, isLoading]);

  // Clean up localStorage and create work when component unmounts
  useEffect(() => {
    return () => {
      if (user && !id && !workCreatedRef.current) {
        const localStorageKey = `banner_work_${user.id}_draft`;
        const savedDraft = localStorage.getItem(localStorageKey);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          const workTitle = parsedDraft.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
          
          const createWork = async () => {
            try {
              workCreatedRef.current = true;
              const { data, error } = await supabase
                .from('work_in_progress')
                .insert([
                  {
                    user_id: user.id,
                    title: workTitle,
                    work_type: 'banner',
                    content: parsedDraft.content,
                  }
                ])
                .select()
                .single();

              if (error) throw error;
              
              if (data) {
                localStorage.removeItem(localStorageKey);
                // Navigate to the new work URL using the slug
                const slug = generateSlug(workTitle);
                navigate(`/banner/${slug}`, { replace: true });
              }
            } catch (error) {
              console.error('Error creating work from draft:', error);
              workCreatedRef.current = false;
            }
          };
          createWork();
        }
      }
    };
  }, [user, id, navigate]);

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
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
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
            handleChange={handleFieldChange}
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
