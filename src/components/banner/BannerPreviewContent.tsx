interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  return (
    <div className="w-full h-full overflow-auto p-4 flex items-start justify-center bg-gray-100">
      <div 
        className="w-[210mm] min-h-[297mm] bg-white shadow-lg"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: previewHtml }} 
          className="w-full h-full p-8"
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