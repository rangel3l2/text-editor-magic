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
    <div className="flex flex-col w-full mb-8">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {institutionLogo && (
            <img 
              src={institutionLogo} 
              alt="Logo da Instituição" 
              className="w-24 h-24 object-contain"
            />
          )}
        </div>
        <div className="flex-1 text-right">
          <div 
            className="institution"
            dangerouslySetInnerHTML={{ __html: institutionName }} 
          />
        </div>
      </div>
      {(title || authors) && (
        <div className="text-center mt-8 space-y-4">
          {title && (
            <h1 
              className="text-2xl font-bold"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          )}
          {authors && (
            <div 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: authors }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewHeader;