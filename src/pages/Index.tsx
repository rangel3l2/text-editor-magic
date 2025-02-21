
import HomeHeader from "@/components/home/HomeHeader";
import AvailableWorkTypes from "@/components/home/AvailableWorkTypes";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <HomeHeader />
      <AvailableWorkTypes onStart={navigate} />
      <WhyChooseSection />
    </MainLayout>
  );
};

export default Index;
