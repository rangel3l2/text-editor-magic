
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import HomeHeader from "@/components/home/HomeHeader";
import WorkInProgress from "@/components/home/WorkInProgress";
import AvailableWorkTypes from "@/components/home/AvailableWorkTypes";
import WhyChooseSection from "@/components/home/WhyChooseSection";

const Index = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-16 sm:pt-20">
        <HomeHeader />
        <WorkInProgress />
        <AvailableWorkTypes onStart={navigate} />
        <WhyChooseSection />
      </div>
    </MainLayout>
  );
};

export default Index;
