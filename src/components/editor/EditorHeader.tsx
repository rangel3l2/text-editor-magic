
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Share2, Eye, RotateCcw } from "lucide-react";

interface EditorHeaderProps {
  title: string;
  onDownload?: () => void;
  onShare?: () => void;
  onPreview?: () => void;
  onClear?: () => void;
  adminButton?: React.ReactNode;
}

const EditorHeader = ({ 
  title,
  onDownload,
  onShare,
  onPreview,
  onClear,
  adminButton
}: EditorHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {adminButton}
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="hidden sm:flex"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Gerar LaTeX
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className="hidden sm:flex"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="hidden sm:flex"
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="hidden sm:flex"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>
    </div>
  );
};

export default EditorHeader;
