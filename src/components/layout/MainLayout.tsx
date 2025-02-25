
import Header from "@/components/Header";

interface MainLayoutProps {
  children: React.ReactNode;
  showWorks?: boolean;
}

const MainLayout = ({ children, showWorks = true }: MainLayoutProps) => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-14">
        {children}
      </main>
    </>
  );
};

export default MainLayout;
