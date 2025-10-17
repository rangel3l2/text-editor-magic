import { useNavigate } from "react-router-dom";

const HomeHeader = () => {
  return (
    <div className="text-center mb-12 sm:mb-16 px-4">
      <img 
        src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png" 
        alt="AIcademic Logo" 
        className="mx-auto w-24 h-24 sm:w-32 sm:h-32 mb-4 sm:mb-6 animate-fade-in"
      />
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 animate-fade-in">AIcademic</h1>
      <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
        Escreva, aprenda, conclua – com AIcademic
      </p>
    </div>
  );
};

export default HomeHeader;