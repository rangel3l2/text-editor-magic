interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100">
      <div 
        className="w-[210mm] h-[297mm] bg-white shadow-lg overflow-hidden flex-shrink-0 transform scale-[0.75] origin-center"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: previewHtml }} 
          className="w-full h-full overflow-y-auto prose max-w-none"
          style={{
            columnCount: 2,
            columnGap: '1cm',
            padding: '3cm 3cm 2cm 3cm',
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: 1.5,
            textAlign: 'justify',
          }}
        />
      </div>
    </div>
  );
};

export default BannerPreviewContent;