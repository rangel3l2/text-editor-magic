import { sanitizeHtml } from "@/utils/sanitize";
import type { LogoConfig } from "../header/LogoUpload";
import { LogoInteractive } from "./LogoInteractive";

interface PreviewHeaderProps {
  institutionName: string;
  institutionLogo?: string;
  logoConfig?: LogoConfig;
  title?: string;
  authors?: string;
  editable?: boolean;
  onLogoConfigChange?: (config: LogoConfig) => void;
}

const PreviewHeader = ({ 
  institutionName, 
  institutionLogo,
  logoConfig,
  title,
  authors,
  editable = false,
  onLogoConfigChange
}: PreviewHeaderProps) => {
  // Function to safely parse HTML content and extract text
  const parseHtmlContent = (htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className="flex flex-col w-full mb-4">
      <div className="banner-header flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4 flex-1">
          {institutionLogo && (
            <LogoInteractive
              src={institutionLogo}
              alt="Logo da Instituição"
              logoConfig={logoConfig}
              onConfigChange={onLogoConfigChange}
              editable={editable}
            />
          )}
          {institutionName && (
            <div 
              className="institution flex-1 text-right text-xl font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(institutionName) }} 
            />
          )}
        </div>
      </div>
      {(title || authors) && (
        <div className="text-center mt-4 space-y-2">
          {title && (
            <h1 className="text-2xl font-bold">
              {parseHtmlContent(title)}
            </h1>
          )}
          {authors && (
            <div 
              className="authors text-sm mt-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(authors) }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewHeader;