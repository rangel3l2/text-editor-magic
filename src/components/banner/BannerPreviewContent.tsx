interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100">
      <div 
        className="w-[210mm] h-[297mm] bg-white shadow-lg overflow-hidden flex-shrink-0"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: previewHtml }} 
          className="banner-preview w-full h-full p-8 overflow-y-auto"
          style={{
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: 1.5,
            textAlign: 'justify',
            color: '#000000',
            backgroundColor: '#FFFFFF',
          }}
        />
      </div>
    </div>
  );
};

export default BannerPreviewContent;