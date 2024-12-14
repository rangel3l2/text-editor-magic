interface BannerPreviewContentProps {
  previewHtml: string;
}

const BannerPreviewContent = ({ previewHtml }: BannerPreviewContentProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div 
        className="w-[210mm] h-[297mm] bg-white shadow-lg rounded-sm overflow-hidden flex-shrink-0 transform scale-[0.75] origin-center"
        style={{
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div 
            className="p-[20mm_20mm_20mm_20mm]"
            style={{
              columnCount: 2,
              columnGap: '10mm', // 1cm
              columnFill: 'auto',
            }}
          >
            <div 
              dangerouslySetInnerHTML={{ __html: previewHtml }} 
              className="prose max-w-none"
              style={{
                breakInside: 'avoid-column',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerPreviewContent;