const BannerPreviewStyles = () => {
  return (
    <style>
      {`
        .banner-section:hover {
          background-color: transparent;
        }
        .banner-section:hover > div {
          background-color: rgb(243 244 246);
        }
        .banner-section.drop-top::before {
          content: '';
          position: absolute;
          top: -3px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #2563eb;
        }
        .banner-section.drop-bottom::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #2563eb;
        }
      `}
    </style>
  );
};

export default BannerPreviewStyles;