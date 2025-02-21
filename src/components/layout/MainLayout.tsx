
import { ReactNode } from "react";
import Header from "@/components/Header";
import WorkInProgress from "@/components/home/WorkInProgress";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
  showWorks?: boolean;
}

const MainLayout = ({ children, showWorks = true }: MainLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto p-6 pt-16">
        {children}
        {showWorks && user && <WorkInProgress />}
      </main>
    </div>
  );
};

export default MainLayout;
