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
  return (
    <div className="flex flex-col w-full mb-4">
      <div className="banner-header flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {institutionLogo && (
            <img 
              src={institutionLogo} 
              alt="Logo da Instituição" 
              className="w-24 h-24 object-contain"
            />
          )}
        </div>
        {institutionName && (
          <div 
            className="institution flex-1 text-right text-xl font-semibold"
            dangerouslySetInnerHTML={{ __html: institutionName }} 
          />
        )}
      </div>
      {(title || authors) && (
        <div className="text-center mt-4 space-y-2">
          {title && (
            <h1 
              className="text-2xl font-bold"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          )}
          {authors && (
            <div 
              className="authors text-sm mt-2"
              dangerouslySetInnerHTML={{ __html: authors }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewHeader;