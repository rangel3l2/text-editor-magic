import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BannerLayout from "./banner/BannerLayout";
import BannerHeader from "./banner/BannerHeader";
import BannerContent from "./banner/BannerContent";
import BannerActions from "./banner/BannerActions";
import { useBannerContent } from "./banner/useBannerContent";
import { useBannerActions } from "./banner/useBannerActions";
import LoginRequiredModal from "./banner/LoginRequiredModal";
import { useWorkLoader } from "./banner/hooks/useWorkLoader";
import { useWorkCreator } from "./banner/hooks/useWorkCreator";
import { useWorkAutoSave } from "./banner/hooks/useWorkAutoSave";
import BannerTemplateSelector from "./banner/templates/BannerTemplateSelector";
import type { BannerTemplatePreset } from "@/hooks/useBannerTemplates";
import type { LogoConfig } from "./banner/header/LogoUpload";
import ImageManagerSidebar from "./banner/ImageManagerSidebar";

const BannerEditor = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasEditedFirstField, setHasEditedFirstField] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

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

  const { isLoading, currentWorkId } = useWorkLoader({
    id,
    user,
    setBannerContent,
  });

  const { setShouldCreateWork, createWorkTimeoutRef, lastFieldValueRef } = useWorkCreator({
    user,
    content,
    bannerContent,
    currentWorkId,
  });

  useWorkAutoSave({
    currentWorkId,
    user,
    content,
    bannerContent,
    isLoading,
  });

  const {
    handleGeneratePDF,
    handleShare,
    handleClearFields
  } = useBannerActions(
    bannerContent,
    setBannerContent,
    initialBannerContent,
  );

  const isFieldComplete = (value: string): boolean => {
    const cleanValue = value.replace(/<[^>]*>/g, '').trim();
    return cleanValue.length >= 10;
  };

  const handleFieldChange = async (field: string, value: string) => {
    // Permite digitar sempre, sem abrir modal automaticamente
    if (!user && !hasEditedFirstField) {
      setHasEditedFirstField(true);
    }

    handleChange(field, value);
    lastFieldValueRef.current = value;

    if (createWorkTimeoutRef.current) {
      clearTimeout(createWorkTimeoutRef.current);
    }

    if (user && !currentWorkId && isFieldComplete(value)) {
      createWorkTimeoutRef.current = setTimeout(() => {
        setShouldCreateWork(true);
      }, 1500);
    }
  };

  const handleSelectTemplate = (template: BannerTemplatePreset) => {
    // Aplicar configurações do template ao banner
    handleChange('templateId', template.id);
    handleChange('columnLayout', template.layout_config.columns.toString() as '2' | '3');
    handleChange('themeColor', template.colors.primary);
    
    // Armazenar cores customizadas
    setBannerContent(prev => ({
      ...prev,
      customColors: template.colors
    }));
  };

  const handleLogoConfigChange = async (logoConfig: LogoConfig) => {
    handleChange('logoConfig', logoConfig);
    
    // Salvar no banco
    if (user && currentWorkId) {
      try {
        const { error: fnError } = await supabase.functions.invoke('update-work-content', {
          body: { id: currentWorkId, contentPatch: { logoConfig } }
        });
        if (fnError) console.error('Erro ao salvar config do logo:', fnError);
      } catch (err) {
        console.error('Erro ao salvar config do logo:', err);
      }
    }
  };

  const handleImageUploadFromEditor = (file: File) => {
    setPendingImageFile(file);
  };

  const handleImageProcessed = () => {
    setPendingImageFile(null);
  };

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
        onLogoConfigChange={handleLogoConfigChange}
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
          
          <BannerTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            currentTemplateId={content.templateId}
          />
          
          <BannerContent
            content={content}
            handleChange={handleFieldChange}
            selectedImage={selectedImage}
            onImageConfigChange={onImageConfigChange}
            onImageUploadFromEditor={handleImageUploadFromEditor}
            pendingImageFile={pendingImageFile}
            onImageProcessed={handleImageProcessed}
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
      <ImageManagerSidebar 
        pendingImageFile={pendingImageFile}
        onImageProcessed={handleImageProcessed}
      />
    </>
  );
};

export default BannerEditor;