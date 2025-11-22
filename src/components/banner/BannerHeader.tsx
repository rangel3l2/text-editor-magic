import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Share2, Eye, RotateCcw, FileCode } from "lucide-react";
import { sanitizeHtml } from "@/utils/sanitize";

interface BannerHeaderProps {
  title: string;
  previewHtml?: string;
  onGeneratePDF: () => void;
  onGenerateLatex: () => void;
  onShare: () => void;
  onOpenPreview: () => void;
  onClearFields: () => void;
}

const BannerHeader = ({ 
  title,
  previewHtml,
  onGeneratePDF,
  onGenerateLatex,
  onShare,
  onOpenPreview,
  onClearFields 
}: BannerHeaderProps) => {
  const headerContent = previewHtml ? previewHtml.split('<div class="banner-section"')[0] : '';

  // Function to safely parse HTML content and extract text
  const parseHtmlContent = (htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{parseHtmlContent(title)}</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGeneratePDF}
            className="hidden sm:flex"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateLatex}
            className="hidden sm:flex"
          >
            <FileCode className="h-4 w-4 mr-2" />
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
            onClick={onOpenPreview}
            className="hidden sm:flex"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFields}
            className="hidden sm:flex"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>
      {headerContent && (
        <div className="col-span-2 w-full mb-4">
          <div 
            className="text-center"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerContent) }}
          />
        </div>
      )}
    </div>
  );
};

export default BannerHeader;