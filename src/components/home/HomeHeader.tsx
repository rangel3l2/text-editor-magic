import { useNavigate } from "react-router-dom";

const HomeHeader = () => {
  return (
    <div className="text-center mb-16">
      <img 
        src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png" 
        alt="AIcademic Logo" 
        className="mx-auto w-32 h-32 mb-4"
      />
      <h1 className="text-4xl font-bold mb-2">AIcademic</h1>
      <p className="text-lg text-muted-foreground">
        Escreva, aprenda, conclua – com AIcademic
      </p>
    </div>
  );
};

export default HomeHeader;