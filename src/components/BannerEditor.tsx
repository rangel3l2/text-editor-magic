import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BannerLayout from "./banner/BannerLayout";
import BannerContent from "./banner/BannerContent";
import { useBannerContent } from "./banner/useBannerContent";
import { useBannerActions } from "./banner/useBannerActions";
import LoginRequiredModal from "./banner/LoginRequiredModal";
import { useWorkLoader } from "./banner/hooks/useWorkLoader";
import { useWorkCreator } from "./banner/hooks/useWorkCreator";
import { useWorkAutoSave } from "./banner/hooks/useWorkAutoSave";
import BannerTemplateSelector from "./banner/templates/BannerTemplateSelector";
import type { BannerTemplatePreset } from "@/hooks/useBannerTemplates";
import type { LogoConfig } from "./banner/header/LogoUpload";
import BannerAttachmentsManager from "./banner/BannerAttachmentsManager";
import { useWorkSharing } from "@/hooks/useWorkSharing";
import ShareDialog from "./banner/sharing/ShareDialog";
import { WorkImporter } from "@/components/WorkImporter";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import EditorSidebar from "@/components/editor/EditorSidebar";
import IFMSGuidelinesViewer from "@/components/editor/IFMSGuidelinesViewer";
import MainLayout from "@/components/layout/MainLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const BannerEditor = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasEditedFirstField, setHasEditedFirstField] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

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
    shares,
    comments,
    shareToken,
    userPermission,
    isLoading: sharingLoading,
    generateShareLink,
    shareWork,
    updateShare,
    removeShare,
    addComment,
    updateComment,
    deleteComment,
  } = useWorkSharing(currentWorkId || undefined, user?.id);

  // Verificar token de compartilhamento
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !user) {
      setShowLoginModal(true);
    }
  }, [searchParams, user]);

  // Abrir seletor de templates automaticamente para banners novos
  useEffect(() => {
    const isNewBanner = !id && !content.title && !content.introduction;
    if (isNewBanner && !templatesOpen) {
      setTemplatesOpen(true);
    }
  }, [id, content.title, content.introduction]);

  const {
    handleGeneratePDF,
    handleGenerateLatex,
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
    // Verificar permissões
    if (userPermission === 'viewer' || userPermission === 'commenter') {
      return; // Não permite edição
    }

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

  const canEdit = userPermission === 'owner' || userPermission === 'editor';
  const canComment = userPermission === 'owner' || userPermission === 'editor' || userPermission === 'commenter';

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

  const handleBannerParsed = (parsedContent: any) => {
    // Atualizar campos do banner
    Object.entries(parsedContent).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        handleChange(key as any, value as string);
      }
    });

    toast({
      title: "✅ Banner importado com sucesso!",
      description: "Todos os campos foram preenchidos automaticamente. Revise o conteúdo.",
    });
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
      <MainLayout>
        {/* Sidebar */}
        <EditorSidebar
          onOverleaf={handleGeneratePDF}
          onDownload={handleGenerateLatex}
          onShare={() => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            if (!currentWorkId) {
              toast({
                title: 'Aguarde',
                description: 'Salve o trabalho primeiro antes de compartilhar',
                variant: 'destructive',
              });
              return;
            }
            if (userPermission === 'owner') {
              setShareDialogOpen(true);
            } else {
              handleShare();
            }
          }}
          onPreview={() => setPreviewOpen(true)}
          onShowGuidelines={() => setGuidelinesOpen(true)}
          onShowTemplates={() => setTemplatesOpen(true)}
          showTemplatesButton={true}
          importButton={<WorkImporter workType="banner" onWorkParsed={handleBannerParsed} />}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Diálogo de Regras IFMS */}
        <IFMSGuidelinesViewer
          open={guidelinesOpen}
          onOpenChange={setGuidelinesOpen}
          workType="banner"
        />

        {/* Diálogo de Templates */}
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Escolha um Template para seu Banner</DialogTitle>
              <DialogDescription>
                Selecione um estilo de layout para começar. Você pode mudar depois clicando em "Templates" no menu lateral.
              </DialogDescription>
            </DialogHeader>
            <BannerTemplateSelector
              onSelectTemplate={(template) => {
                handleSelectTemplate(template);
                setTemplatesOpen(false);
                toast({
                  title: "Template aplicado!",
                  description: "Você pode alterá-lo a qualquer momento pelo menu lateral.",
                });
              }}
              currentTemplateId={content.templateId}
            />
          </DialogContent>
        </Dialog>

        <div 
          className="transition-all duration-300" 
          style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">
              {content.title ? content.title.replace(/<[^>]*>/g, '').trim() : "Novo Banner"}
            </h1>
            {/* Indicador de permissão */}
            {userPermission && userPermission !== 'owner' && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Trabalho compartilhado</p>
                    <p className="text-sm text-muted-foreground">
                      {userPermission === 'viewer' && 'Você tem permissão apenas para visualizar'}
                      {userPermission === 'editor' && 'Você pode editar este trabalho'}
                      {userPermission === 'commenter' && 'Você pode comentar nas seções'}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  userPermission === 'viewer' ? 'secondary' :
                  userPermission === 'editor' ? 'default' :
                  'outline'
                }>
                  {userPermission === 'viewer' && 'Visualizador'}
                  {userPermission === 'editor' && 'Editor'}
                  {userPermission === 'commenter' && 'Comentador'}
                </Badge>
              </div>
            )}
            
            <BannerContent
              content={content}
              handleChange={handleFieldChange}
              selectedImage={selectedImage}
              onImageConfigChange={onImageConfigChange}
              onImageUploadFromEditor={handleImageUploadFromEditor}
              pendingImageFile={pendingImageFile}
              onImageProcessed={handleImageProcessed}
            />
          </div>
        </div>

        {/* Preview Dialog */}
        <BannerLayout
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          content={content}
          onImageConfigChange={onImageConfigChange}
          onLogoConfigChange={handleLogoConfigChange}
          onContentUpdate={handleFieldChange}
          onGeneratePDF={handleGeneratePDF}
          onGenerateLatex={handleGenerateLatex}
        >
          <div />
        </BannerLayout>

        <BannerAttachmentsManager 
          pendingImageFile={pendingImageFile}
          onImageProcessed={handleImageProcessed}
        />
      </MainLayout>

      <OnboardingTutorial />
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        workId={currentWorkId || ''}
        shareToken={shareToken}
        shares={shares}
        onGenerateLink={generateShareLink}
        onShareWork={shareWork}
        onUpdateShare={updateShare}
        onRemoveShare={removeShare}
      />
    </>
  );
};

export default BannerEditor;