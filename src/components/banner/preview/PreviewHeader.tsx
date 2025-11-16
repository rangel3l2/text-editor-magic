import { sanitizeHtml } from "@/utils/sanitize";

interface PreviewHeaderProps {
  institutionName: string;
  institutionLogo?: string;
  title?: string;
  authors?: string;
}

const PreviewHeader = ({ 
  institutionName, 
  institutionLogo,
  title,
  authors
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
            <img 
              src={institutionLogo} 
              alt="Logo da Instituição" 
              className="max-h-32 max-w-[40%] w-auto object-contain"
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