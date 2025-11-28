import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileDown,
  FileCode,
  Share2,
  Eye,
  BookOpen,
  Upload,
  ChevronLeft,
  ChevronRight,
  Palette,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EditorSidebarProps {
  onOverleaf: () => void;
  onDownload: () => void;
  onShare: () => void;
  onPreview: () => void;
  onShowGuidelines: () => void;
  onShowTemplates?: () => void;
  importButton?: React.ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showTemplatesButton?: boolean;
}

const EditorSidebar = ({
  onOverleaf,
  onDownload,
  onShare,
  onPreview,
  onShowGuidelines,
  onShowTemplates,
  importButton,
  isCollapsed = false,
  onToggleCollapse,
  showTemplatesButton = false,
}: EditorSidebarProps) => {
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);

  const collapsed = onToggleCollapse ? isCollapsed : localCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));

  const sidebarItems = [
    {
      icon: Eye,
      label: "Visualizar",
      onClick: onPreview,
      variant: "default" as const,
      highlighted: true,
    },
    ...(showTemplatesButton ? [{
      icon: Palette,
      label: "Templates",
      onClick: onShowTemplates || (() => {}),
      variant: "outline" as const,
    }] : []),
    {
      icon: FileDown,
      label: "Abrir no Overleaf",
      onClick: onOverleaf,
      variant: "outline" as const,
    },
    {
      icon: FileCode,
      label: "Baixar LaTeX",
      onClick: onDownload,
      variant: "outline" as const,
    },
    {
      icon: Share2,
      label: "Compartilhar",
      onClick: onShare,
      variant: "outline" as const,
    },
    {
      icon: BookOpen,
      label: "Regras IFMS",
      onClick: onShowGuidelines,
      variant: "outline" as const,
    },
  ];

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-background border-r border-border transition-all duration-300 z-40 flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header com botão de colapsar */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <h3 className="font-semibold text-sm">Ferramentas</h3>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const button = (
              <Button
                key={index}
                variant={item.variant}
                onClick={item.onClick}
                className={cn(
                  "w-full justify-start gap-3 transition-all",
                  collapsed ? "px-0 justify-center" : "",
                  item.highlighted && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                )}
              >
                <Icon className={cn("h-5 w-5", item.highlighted && "animate-pulse")} />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}

          {importButton && (
            <>
              <Separator className="my-2" />
              <div className={cn("w-full", collapsed ? "flex justify-center" : "")}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center justify-center">
                        <Upload className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Importar Trabalho</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  importButton
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t text-xs text-muted-foreground">
            <p className="font-medium mb-1">Dica:</p>
            <p>Use o botão "Visualizar" para ver seu trabalho formatado em A4.</p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button
            variant="ghost"
            onClick={onPreview}
            className="flex flex-col items-center gap-1 h-auto py-2 bg-primary/10 text-primary"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs">Ver</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onOverleaf}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <FileDown className="h-5 w-5" />
            <span className="text-xs">PDF</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onShare}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Compartilhar</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onShowGuidelines}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Regras</span>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EditorSidebar;
