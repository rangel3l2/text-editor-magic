import React from 'react';

interface BannerHeaderProps {
  previewHtml: string;
}

const BannerHeader = ({ previewHtml }: BannerHeaderProps) => {
  return (
    <div className="col-span-2 w-full mb-4">
      <div 
        className="text-center"
        dangerouslySetInnerHTML={{ 
          __html: previewHtml.split('<div class="banner-section"')[0] 
        }}
      />
    </div>
  );
};

export default BannerHeader;