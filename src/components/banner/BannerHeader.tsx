interface BannerHeaderProps {
  title: string;
}

const BannerHeader = ({ title }: BannerHeaderProps) => {
  return (
    <h2 className="text-2xl font-bold">{title}</h2>
  );
};

export default BannerHeader;