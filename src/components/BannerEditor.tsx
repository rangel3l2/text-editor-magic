import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const [shouldCreateWork, setShouldCreateWork] = useState(false);
  const createWorkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFieldValueRef = useRef<string>("");
  const [hasShownFirstLoadError, setHasShownFirstLoadError] = useState(false);
  
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

  const isFieldComplete = (value: string): boolean => {
    const cleanValue = value.replace(/<[^>]*>/g, '').trim();
    return cleanValue.length >= 10;
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!user && !hasEditedFirstField) {
      setHasEditedFirstField(true);
    } else if (!user && hasEditedFirstField) {
      setShowLoginModal(true);
      return;
    }

    handleChange(field, value);
    lastFieldValueRef.current = value;

    if (createWorkTimeoutRef.current) {
      clearTimeout(createWorkTimeoutRef.current);
    }

    if (user && !id && !workCreatedRef.current && isFieldComplete(value)) {
      createWorkTimeoutRef.current = setTimeout(() => {
        setShouldCreateWork(true);
      }, 1500);
    }
  };

  // Create new work when shouldCreateWork is true
  useEffect(() => {
    if (shouldCreateWork && user && !id && !workCreatedRef.current) {
      const createWork = async () => {
        try {
          console.log('Creating new work...');
          workCreatedRef.current = true;
          const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
          
          const { data, error } = await supabase
            .from('work_in_progress')
            .insert([
              {
                user_id: user.id,
                title: workTitle,
                work_type: 'banner',
                content: bannerContent,
              }
            ])
            .select()
            .single();

          if (error) throw error;
          
          console.log('Work created:', data);
          if (data) {
            localStorage.removeItem(`banner_work_${user.id}_draft`);
            const slug = generateSlug(workTitle);
            navigate(`/banner/${data.id}`, { replace: true });
          }
        } catch (error) {
          console.error('Error creating work:', error);
          workCreatedRef.current = false;
          toast({
            title: "Erro ao criar trabalho",
            description: "Não foi possível criar o trabalho. Tente novamente.",
            variant: "destructive",
          });
        } finally {
          setShouldCreateWork(false);
        }
      };

      createWork();
    }
  }, [shouldCreateWork, user, id, content.title, bannerContent, navigate, toast]);

  // Load existing work if ID is provided
  useEffect(() => {
    const loadWork = async () => {
      try {
        if (!id) {
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
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          navigate('/', { replace: true });
          return;
        }
        
        if (data?.content) {
          setBannerContent(data.content);
          localStorage.removeItem(`banner_work_${user.id}_draft`);
        }
      } catch (error) {
        console.error('Error in loadWork:', error);
        if (!hasShownFirstLoadError) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Não foi possível carregar o trabalho. Verifique sua conexão.",
            variant: "destructive",
          });
          setHasShownFirstLoadError(true);
        }
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