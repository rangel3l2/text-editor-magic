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
  const [currentWorkId, setCurrentWorkId] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadAttemptRef = useRef(0);
  const maxLoadAttempts = 3;
  const isLoadingRef = useRef(false);
  
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateUniqueTitle = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const randomId = Math.floor(Math.random() * 10000);
    return `Trabalho Desconhecido #${randomId} (${timestamp})`;
  };

  const isFieldComplete = (value: string): boolean => {
    const cleanValue = value.replace(/<[^>]*>/g, '').trim();
    return cleanValue.length >= 10;
  };

  const handleFieldChange = async (field: string, value: string) => {
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

    if (user && !currentWorkId && !workCreatedRef.current && isFieldComplete(value)) {
      createWorkTimeoutRef.current = setTimeout(() => {
        setShouldCreateWork(true);
      }, 1500);
    }
  };

  useEffect(() => {
    if (shouldCreateWork && user && !currentWorkId && !workCreatedRef.current) {
      const createWork = async () => {
        try {
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
            .maybeSingle();

          if (error) {
            console.error('Erro ao criar trabalho:', error);
            throw error;
          }
          
          if (data) {
            localStorage.removeItem(`banner_work_${user.id}_draft`);
            setCurrentWorkId(data.id);
            navigate(`/banner/${data.id}`);
          }
        } catch (error: any) {
          console.error('Erro ao criar trabalho:', error);
          workCreatedRef.current = false;
          toast({
            title: "Erro ao criar trabalho",
            description: "Ocorreu um erro ao criar seu trabalho. Por favor, tente novamente.",
            variant: "destructive",
          });
        } finally {
          setShouldCreateWork(false);
        }
      };

      createWork();
    }
  }, [shouldCreateWork, user, currentWorkId, content.title, bannerContent, toast, navigate]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadWork = async () => {
      if (isLoadingRef.current || !isMounted) return;
      isLoadingRef.current = true;

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

        setCurrentWorkId(id);

        if (!user) {
          navigate('/', { replace: true });
          return;
        }

        const { data, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .abortSignal(controller.signal)
          .maybeSingle();

        if (error) {
          if (error.message?.includes('JWT')) {
            console.error('Erro de autenticação:', error);
            toast({
              title: "Sessão expirada",
              description: "Por favor, faça login novamente.",
              variant: "destructive",
            });
            return;
          }
          
          if (loadAttemptRef.current < maxLoadAttempts) {
            loadAttemptRef.current += 1;
            if (isMounted) {
              setTimeout(loadWork, 2000 * loadAttemptRef.current);
            }
            return;
          }

          toast({
            title: "Erro de conexão",
            description: "Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.",
            variant: "destructive",
          });
          return;
        }

        if (!data) {
          if (loadAttemptRef.current < maxLoadAttempts) {
            loadAttemptRef.current += 1;
            if (isMounted) {
              setTimeout(loadWork, 2000 * loadAttemptRef.current);
            }
            return;
          }
          
          toast({
            title: "Trabalho não encontrado",
            description: "O trabalho que você selecionou não foi encontrado ou você não tem permissão para acessá-lo.",
            variant: "destructive",
          });
          navigate('/', { replace: true });
          return;
        }
        
        if (data?.content && isMounted) {
          setBannerContent(data.content);
          localStorage.removeItem(`banner_work_${user.id}_draft`);
          loadAttemptRef.current = 0;
        }
      } catch (error: any) {
        console.error('Erro ao carregar trabalho:', error);
        if (loadAttemptRef.current < maxLoadAttempts && isMounted) {
          loadAttemptRef.current += 1;
          setTimeout(loadWork, 2000 * loadAttemptRef.current);
          return;
        }
        
        if (!hasShownFirstLoadError && isMounted) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Ocorreu um erro ao tentar carregar o trabalho selecionado. Por favor, tente novamente.",
            variant: "destructive",
          });
          setHasShownFirstLoadError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      }
    };

    loadWork();

    return () => {
      isMounted = false;
      controller.abort();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [id, user, setBannerContent, navigate, toast, hasShownFirstLoadError]);

  useEffect(() => {
    if (!currentWorkId || !user || isLoading) return;

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
          .eq('id', currentWorkId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao salvar trabalho:', error);
          throw error;
        }
      } catch (error) {
        console.error('Erro ao salvar trabalho:', error);
      }
    };

    const debounceTimeout = setTimeout(saveWork, 1000);
    return () => clearTimeout(debounceTimeout);
  }, [content, bannerContent, user, currentWorkId, isLoading]);

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