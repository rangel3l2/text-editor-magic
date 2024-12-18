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
          className="w-full h-full overflow-y-auto"
          style={{
            padding: '2cm',
            columnCount: 2,
            columnGap: '1cm',
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