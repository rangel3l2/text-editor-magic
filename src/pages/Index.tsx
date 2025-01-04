import { useNavigate } from "react-router-dom";
import HomeHeader from "@/components/home/HomeHeader";
import WorkInProgress from "@/components/home/WorkInProgress";
import AvailableWorkTypes from "@/components/home/AvailableWorkTypes";
import WhyChooseSection from "@/components/home/WhyChooseSection";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <HomeHeader />
      <WorkInProgress />
      <AvailableWorkTypes onStart={navigate} />
      <WhyChooseSection />
    </div>
  );
};

export default Index;