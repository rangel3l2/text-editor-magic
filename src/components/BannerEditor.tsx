import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
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

const BannerEditor = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasEditedFirstField, setHasEditedFirstField] = useState(false);

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
          
          <BannerTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            currentTemplateId={content.templateId}
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