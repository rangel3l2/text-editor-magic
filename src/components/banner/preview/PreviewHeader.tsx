interface PreviewHeaderProps {
  institutionName: string;
  institutionLogo?: string;
}

const PreviewHeader = ({ institutionName, institutionLogo }: PreviewHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b mb-8">
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
        <div dangerouslySetInnerHTML={{ __html: institutionName }} />
      </div>
    </div>
  );
};

export default PreviewHeader;