import { useState, useEffect } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { AvailableWorksSection } from "@/components/home/AvailableWorksSection";
import { MyWorksSection } from "@/components/home/MyWorksSection";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [hasWorks, setHasWorks] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <HeroSection />
      <AvailableWorksSection />
      {user && <MyWorksSection />}
      <FeaturesSection />
    </div>
  );
};

export default Index;