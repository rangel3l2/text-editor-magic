import React from 'react';

interface BannerHeaderProps {
  previewHtml: string;
}

const BannerHeader = ({ previewHtml }: BannerHeaderProps) => {
  if (!previewHtml) return null;

  const headerContent = previewHtml.split('<div class="banner-section"')[0];
  
  return (
    <div className="col-span-2 w-full mb-4">
      <div 
        className="text-center"
        dangerouslySetInnerHTML={{ __html: headerContent }}
      />
    </div>
  );
};

export default BannerHeader;