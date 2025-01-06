import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import BannerEditor from "./components/BannerEditor";
import TextEditor from "./components/TextEditor";
import LoadingScreen from "./components/LoadingScreen";
import { Suspense, useState } from "react";
import Index from "./pages/Index";
import Header from "./components/Header";
import AdminSettings from "./pages/AdminSettings";
import ArticleEditor from "./pages/ArticleEditor";
import ThesisEditor from "./pages/ThesisEditor";
import MonographyEditor from "./pages/MonographyEditor";
import InterventionProjectEditor from "./pages/InterventionProjectEditor";
import { useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

function AppContent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <AuthProvider onSignOut={() => navigate('/')}>
      {isLoading && <LoadingScreen onLoadComplete={() => setIsLoading(false)} />}
      <Suspense fallback={<LoadingScreen />}>
        <Header />
        <div className="pt-14">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/banner" element={<BannerEditor />} />
            <Route path="/article" element={<ArticleEditor />} />
            <Route path="/thesis" element={<ThesisEditor />} />
            <Route path="/monography" element={<MonographyEditor />} />
            <Route path="/intervention" element={<InterventionProjectEditor />} />
            <Route path="/admin" element={<AdminSettings />} />
          </Routes>
        </div>
        <Toaster />
      </Suspense>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="aicademic-theme">
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;