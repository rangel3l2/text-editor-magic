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

const BannerEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const createTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Generate unique title for untitled works
  const generateUniqueTitle = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const randomId = Math.floor(Math.random() * 10000);
    return `Trabalho Desconhecido #${randomId} (${timestamp})`;
  };

  // Create new work entry only when user makes first edit
  const createNewWork = async () => {
    if (!user || isCreating || id) return;
    
    setIsCreating(true);
    try {
      const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
      
      const { data, error } = await supabase
        .from('work_in_progress')
        .insert([
          {
            user_id: user.id,
            title: workTitle,
            work_type: 'banner',
            content: initialBannerContent,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        navigate(`/banner/${data.id}`, { replace: true });
        toast({
          title: "Trabalho criado",
          description: "Um novo banner foi iniciado.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error creating new work:', error);
      toast({
        title: "Erro ao criar trabalho",
        description: "Não foi possível criar um novo trabalho.",
        variant: "destructive",
      });
      navigate('/', { replace: true });
    } finally {
      setIsCreating(false);
    }
  };

  // Load existing work if ID is provided
  useEffect(() => {
    const loadWork = async () => {
      try {
        if (!id) {
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
    const saveWork = async () => {
      if (!id || !user || isLoading || isCreating) {
        return;
      }

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
  }, [content, bannerContent, user, id, isLoading, isCreating]);

  // Create new work when user starts editing with debounce
  useEffect(() => {
    if (!id && user && !isCreating && Object.values(content).some(value => value)) {
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
      }
      
      createTimeoutRef.current = setTimeout(() => {
        createNewWork();
      }, 2000); // Wait 2 seconds after typing before creating new work
    }
    
    return () => {
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
      }
    };
  }, [content, id, user, isCreating]);

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