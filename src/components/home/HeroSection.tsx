import { LoginButton } from "@/components/LoginButton";

export const HeroSection = () => {
  return (
    <div className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-16">
          <img 
            src="/lovable-uploads/16ebf0c7-f8d8-44a5-97a9-385bf41881e7.png" 
            alt="AIcademic Logo" 
            className="w-64 h-auto mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            AIcademic
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mb-8">
            Escreva, aprenda, conclua – com AIcademic
          </p>
          <LoginButton />
        </div>
      </div>
    </div>
  );
};